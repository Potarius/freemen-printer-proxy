#!/usr/bin/env node
/**
 * Micro-service proxy pour imprimante Brother QL-710W
 * Expose l'imprimante locale via API REST pour serveur cloud
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const rateLimiter = require('./middleware/rateLimiter');
const PrinterClient = require('./lib/printer');
const discovery = require('./lib/discovery');
const printerModels = require('./lib/printerModels');
const configManager = require('./lib/config');

// ============================================
// VERSION INFO
// ============================================
const packageJson = require('./package.json');
const APP_VERSION = packageJson.version;
const APP_NAME = packageJson.name;
const APP_START_TIME = new Date();

// ============================================
// SYSTÈME DE STATISTIQUES
// ============================================
const STATS_FILE = path.join(__dirname, 'data', 'print-stats.json');

// S'assurer que le dossier data existe
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Charger les stats depuis le fichier
function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Erreur chargement stats:', e.message);
  }
  return { daily: {}, total: 0 };
}

// Sauvegarder les stats
function saveStats(stats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error('Erreur sauvegarde stats:', e.message);
  }
}

// Enregistrer un job d'impression
function recordPrintJob(type = 'qr', labels = 1) {
  const stats = loadStats();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (!stats.daily[today]) {
    stats.daily[today] = { count: 0, labels: 0, types: {} };
  }
  
  stats.daily[today].count += 1;
  stats.daily[today].labels += labels;
  stats.daily[today].types[type] = (stats.daily[today].types[type] || 0) + 1;
  stats.total += 1;
  
  // Garder seulement les 90 derniers jours
  const dates = Object.keys(stats.daily).sort();
  if (dates.length > 90) {
    dates.slice(0, dates.length - 90).forEach(d => delete stats.daily[d]);
  }
  
  saveStats(stats);
  return stats;
}

// Obtenir les stats
function getStats() {
  const stats = loadStats();
  const today = new Date().toISOString().split('T')[0];
  const todayStats = stats.daily[today] || { count: 0, labels: 0 };
  
  // Stats des 7 derniers jours pour le graphique
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last7Days.push({
      date: dateStr,
      label: d.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric' }),
      count: stats.daily[dateStr]?.count || 0,
      labels: stats.daily[dateStr]?.labels || 0
    });
  }
  
  // Stats des 30 derniers jours
  let last30Count = 0;
  let last30Labels = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last30Count += stats.daily[dateStr]?.count || 0;
    last30Labels += stats.daily[dateStr]?.labels || 0;
  }
  
  return {
    today: todayStats,
    last7Days,
    last30Days: { count: last30Count, labels: last30Labels },
    total: stats.total
  };
}

// Logger (défini en premier car utilisé partout)
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Configuration
const PORT = process.env.PORT || 6500;
const API_KEY = process.env.API_KEY || 'dev-key-change-in-production';

// Charger la config persistée (avec fallback sur .env)
let printerConfig = configManager.getConfig();
let PRINTER_IP = printerConfig.printer.ip;
let PRINTER_PORT = printerConfig.printer.port;
let PRINTER_PROTOCOL = printerConfig.printer.protocol;

// Instance du client imprimante
let printerClient = null;
let lastPrinterStatus = { connected: false, lastCheck: null };
let activeScan = null; // Pour tracker un scan en cours

// Initialiser le client imprimante
const initPrinterClient = (forceNew = false) => {
  if (forceNew || !printerClient) {
    // Recharger la config
    printerConfig = configManager.getConfig();
    PRINTER_IP = printerConfig.printer.ip;
    PRINTER_PORT = printerConfig.printer.port;
    PRINTER_PROTOCOL = printerConfig.printer.protocol;
    
    printerClient = new PrinterClient({
      ip: PRINTER_IP,
      port: parseInt(PRINTER_PORT, 10),
      protocol: PRINTER_PROTOCOL,
      timeout: 5000,
      logger
    });
  }
  return printerClient;
};

// Vérifier le statut de l'imprimante (avec cache de 10s)
const checkPrinterStatus = async (forceCheck = false) => {
  const now = Date.now();
  const cacheAge = lastPrinterStatus.lastCheck ? now - lastPrinterStatus.lastCheck : Infinity;
  
  // Si pas d'IP configurée, retourner un statut "non configuré"
  if (!PRINTER_IP || PRINTER_IP.trim() === '') {
    return {
      connected: false,
      configured: false,
      message: 'Aucune imprimante configurée. Utilisez l\'onglet Configuration pour scanner et sélectionner une imprimante.',
      lastCheck: now
    };
  }
  
  if (!forceCheck && cacheAge < 10000 && lastPrinterStatus.lastCheck) {
    return lastPrinterStatus;
  }
  
  try {
    if (!printerClient) initPrinterClient();
    const result = await printerClient.testConnection();
    lastPrinterStatus = {
      ...result,
      configured: true,
      lastCheck: now,
      cached: false
    };
  } catch (error) {
    lastPrinterStatus = {
      connected: false,
      configured: true,
      error: error.message,
      lastCheck: now,
      cached: false
    };
  }
  
  return lastPrinterStatus;
};

// Initialisation app Express
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Pour permettre les scripts inline du dashboard
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// Servir le dashboard statique
app.use(express.static(path.join(__dirname, 'public')));

// Middleware d'authentification API key
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    logger.warn('Tentative d\'accès sans API key', { ip: req.ip });
    return res.status(401).json({ error: 'API key requise' });
  }
  
  if (apiKey !== API_KEY) {
    logger.warn('API key invalide', { ip: req.ip });
    return res.status(403).json({ error: 'API key invalide' });
  }
  
  next();
};

// Routes de santé (publiques)
app.get('/api', (req, res) => {
  res.json({
    service: 'Freemen Printer Proxy',
    version: APP_VERSION,
    status: 'online',
    endpoints: {
      dashboard: 'GET /',
      health: 'GET /health',
      status: 'GET /status (auth)',
      printTest: 'POST /print/test (auth)',
      printQr: 'POST /print/qr (auth)',
      printRaw: 'POST /print/raw (auth)'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    const printerStatus = await checkPrinterStatus();
    const isHealthy = printerStatus.connected;
    const stats = getStats();
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      service: APP_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      printer: {
        ip: PRINTER_IP,
        port: PRINTER_PORT,
        protocol: PRINTER_PROTOCOL,
        connected: printerStatus.connected,
        message: printerStatus.message || printerStatus.error || 'Unknown',
        lastCheck: printerStatus.lastCheck ? new Date(printerStatus.lastCheck).toISOString() : null
      },
      stats: {
        today: stats.today.count,
        todayLabels: stats.today.labels
      }
    });
  } catch (error) {
    logger.error('Erreur health check', { error: error.message });
    res.status(500).json({
      status: 'error',
      service: 'printer-proxy',
      error: error.message
    });
  }
});

// Endpoint pour les statistiques complètes
app.get('/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/status', authenticate, async (req, res) => {
  try {
    const forceCheck = req.query.refresh === 'true';
    const printerStatus = await checkPrinterStatus(forceCheck);
    
    res.json({
      printer: {
        ip: PRINTER_IP,
        port: PRINTER_PORT,
        protocol: PRINTER_PROTOCOL,
        connected: printerStatus.connected,
        message: printerStatus.message || printerStatus.error,
        lastCheck: printerStatus.lastCheck ? new Date(printerStatus.lastCheck).toISOString() : null,
        supportedProtocols: ['JetDirect (9100)', 'IPP (631)'],
        labelSizes: [
          { name: 'small', width: 29, height: 29, description: '29×29mm (QR only)' },
          { name: 'medium', width: 62, height: 29, description: '62×29mm (landscape)' },
          { name: 'large', width: 62, height: 62, description: '62×62mm (square)' }
        ]
      },
      service: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        requests: req.rateLimit
      }
    });
  } catch (error) {
    logger.error('Erreur status', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// System info endpoint (version, uptime, environment)
app.get('/admin/info', authenticate, (req, res) => {
  const config = configManager.getConfig();
  res.json({
    service: 'Freemen Printer Proxy',
    version: APP_VERSION,
    environment: process.env.NODE_ENV || 'development',
    startTime: APP_START_TIME.toISOString(),
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    printer: {
      configured: !!(config.printer && config.printer.ip),
      ip: config.printer?.ip || null,
      model: config.printer?.model || null
    }
  });
});

// Helper to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Check for updates (compares local version with remote)
app.get('/admin/check-update', authenticate, async (req, res) => {
  try {
    // For now, just return current version info
    // In a future implementation, this could check a remote source
    res.json({
      currentVersion: APP_VERSION,
      updateAvailable: false,
      message: 'Version check requires manual verification. Run ./scripts/update.sh to update.',
      howToUpdate: [
        'SSH into the server',
        'cd to project directory',
        'Run: ./scripts/update.sh',
        'Or use: ./deploy-menu.sh for interactive menu'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restart info (cannot restart from within container, provide instructions)
app.get('/admin/restart-info', authenticate, (req, res) => {
  res.json({
    canRestartFromUI: false,
    reason: 'Container cannot restart itself safely',
    instructions: [
      'SSH into the server',
      'Run: docker compose restart',
      'Or use: ./deploy-menu.sh option 2'
    ],
    commands: {
      restart: 'docker compose restart',
      stop: 'docker compose down',
      start: 'docker compose up -d',
      logs: 'docker compose logs -f',
      status: 'docker compose ps'
    }
  });
});

// Logs endpoint (last N lines of application logs)
app.get('/admin/logs', authenticate, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const logFile = path.join(__dirname, 'logs', 'combined.log');
  
  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n').slice(-limit);
      res.json({
        lines: lines,
        count: lines.length,
        file: 'combined.log'
      });
    } else {
      res.json({
        lines: [],
        count: 0,
        message: 'No log file found'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ENDPOINTS DE DÉCOUVERTE ET CONFIGURATION
// ============================================

// Liste des modèles Brother compatibles
app.get('/models', (req, res) => {
  try {
    const networkModels = printerModels.getNetworkCompatibleModels();
    res.json({
      models: printerModels.BROTHER_MODELS,
      networkCompatible: networkModels,
      labelSizes: printerModels.LABEL_SIZES,
      presets: printerModels.PRINT_PRESETS
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir la configuration actuelle
app.get('/config', authenticate, (req, res) => {
  try {
    const config = configManager.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Définir l'imprimante active
app.post('/config/printer', authenticate, async (req, res) => {
  try {
    const { ip, port = 9100, protocol = 'jetdirect', name, model } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP requise' });
    }
    
    // Tester la connexion d'abord
    const testResult = await discovery.testPrinter(ip, port);
    
    if (!testResult.success) {
      return res.status(400).json({ 
        error: `Impossible de se connecter à ${ip}:${port}`,
        details: testResult.error
      });
    }
    
    // Déterminer le nom et modèle
    const detectedModel = testResult.model?.model || model || null;
    const printerName = name || detectedModel || `Imprimante ${ip}`;
    
    // Sauvegarder la config active
    const printerInfo = configManager.setActivePrinter({
      ip,
      port,
      protocol,
      name: printerName,
      model: detectedModel,
      series: testResult.model?.series || null,
      media: testResult.model?.media || null,
      autoDetected: !!testResult.model
    });
    
    // Auto-enregistrer dans les favoris si pas déjà présent
    const config = configManager.getConfig();
    const alreadySaved = config.savedPrinters?.some(p => p.ip === ip);
    if (!alreadySaved) {
      configManager.savePrinter({
        ip,
        port,
        protocol,
        name: printerName,
        model: detectedModel,
        series: testResult.model?.series || null
      });
      logger.info('Imprimante ajoutée aux favoris', { ip, name: printerName });
    }
    
    // Réinitialiser le client imprimante
    initPrinterClient(true);
    lastPrinterStatus = { connected: false, lastCheck: null };
    
    logger.info('Imprimante configurée', { ip, port, model: detectedModel, name: printerName });
    
    res.json({
      success: true,
      message: 'Imprimante configurée avec succès',
      printer: printerInfo,
      detected: testResult.model,
      savedToFavorites: !alreadySaved
    });
    
  } catch (error) {
    logger.error('Erreur config imprimante', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Sauvegarder une imprimante dans les favoris
app.post('/config/printers/save', authenticate, (req, res) => {
  try {
    const { ip, port, protocol, name, model } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP requise' });
    }
    
    const savedPrinters = configManager.savePrinter({
      ip,
      port: port || 9100,
      protocol: protocol || 'jetdirect',
      name: name || `Imprimante ${ip}`,
      model: model || null
    });
    
    res.json({ success: true, savedPrinters });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier une imprimante enregistrée
app.patch('/config/printers/:ip', authenticate, (req, res) => {
  try {
    const originalIp = req.params.ip;
    const { name, model, ip, port } = req.body;
    
    const savedPrinters = configManager.updateSavedPrinter(originalIp, {
      name,
      model,
      ip: ip || originalIp,
      port: port || 9100
    });
    
    res.json({ success: true, savedPrinters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une imprimante des favoris
app.delete('/config/printers/:ip', authenticate, (req, res) => {
  try {
    const { ip } = req.params;
    const savedPrinters = configManager.removeSavedPrinter(ip);
    res.json({ success: true, savedPrinters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour les préférences
app.patch('/config/preferences', authenticate, (req, res) => {
  try {
    const preferences = configManager.updatePreferences(req.body);
    res.json({ success: true, preferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tester une imprimante spécifique (sans la configurer)
app.post('/test-printer', authenticate, async (req, res) => {
  try {
    const { ip, port = 9100 } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP requise' });
    }
    
    logger.info('Test imprimante', { ip, port });
    
    const result = await discovery.testPrinter(ip, port);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Erreur test imprimante', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Scan rapide du réseau (IPs communes seulement)
app.get('/discover/quick', authenticate, async (req, res) => {
  try {
    logger.info('Scan rapide du réseau');
    
    const results = await discovery.quickScan({ timeout: 1500 });
    
    // Enregistrer les résultats
    configManager.recordScanResults(results);
    
    res.json({
      success: true,
      found: results.length,
      printers: results,
      scanType: 'quick',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erreur scan rapide', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Scan complet du réseau
app.get('/discover', authenticate, async (req, res) => {
  try {
    // Éviter les scans simultanés
    if (activeScan) {
      return res.status(409).json({ 
        error: 'Un scan est déjà en cours',
        scanId: activeScan.id
      });
    }
    
    const scanId = `scan_${Date.now()}`;
    activeScan = { id: scanId, startedAt: Date.now(), progress: 0 };
    
    logger.info('Scan complet du réseau démarré', { scanId });
    
    const results = await discovery.scanNetwork({
      timeout: 800,
      concurrency: 30,
      progressCallback: (progress) => {
        if (activeScan) {
          activeScan.progress = Math.round((progress.completed / progress.total) * 100);
          activeScan.found = progress.found;
        }
      }
    });
    
    // Enregistrer les résultats
    configManager.recordScanResults(results);
    
    const duration = Date.now() - activeScan.startedAt;
    activeScan = null;
    
    logger.info('Scan complet terminé', { found: results.length, duration });
    
    res.json({
      success: true,
      found: results.length,
      printers: results,
      scanType: 'full',
      duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    activeScan = null;
    logger.error('Erreur scan complet', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Statut du scan en cours
app.get('/discover/status', authenticate, (req, res) => {
  if (activeScan) {
    res.json({
      scanning: true,
      ...activeScan
    });
  } else {
    const lastScan = configManager.getLastScan();
    res.json({
      scanning: false,
      lastScan
    });
  }
});

// Obtenir les infos réseau local
app.get('/network', authenticate, (req, res) => {
  try {
    const ranges = discovery.getLocalNetworkRanges();
    res.json({
      ranges,
      ports: discovery.PRINTER_PORTS
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route de test d'impression
app.post('/print/test', authenticate, async (req, res) => {
  try {
    const { labelSize = 'medium' } = req.body;
    
    logger.info('Test d\'impression demandé', { labelSize, ip: req.ip });
    
    if (!printerClient) initPrinterClient();
    
    // Générer une étiquette de test avec texte simple
    // Brother QL utilise le format raster ESC/P
    const testLabel = generateTestLabel(labelSize);
    
    // Envoyer à l'imprimante
    const result = await printerClient.sendRawData(testLabel);
    
    // Enregistrer le job dans les stats
    recordPrintJob('test', 1);
    
    logger.info('Test d\'impression envoyé', { bytesSent: result.bytesSent });
    
    res.json({
      success: true,
      message: 'Test d\'impression envoyé à l\'imprimante',
      labelSize,
      bytesSent: result.bytesSent,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erreur test d\'impression', { error: error.message });
    res.status(500).json({ error: error.message || 'Échec du test d\'impression' });
  }
});

/**
 * Génère une étiquette de test pour Brother QL-710W
 * Format: Raster ESC/P avec texte "TEST" et date/heure
 */
function generateTestLabel(labelSize = 'medium') {
  const commands = [];
  
  // === Initialisation Brother QL ===
  // Invalidate (clear buffer)
  commands.push(Buffer.from([0x00].concat(Array(200).fill(0x00))));
  
  // Initialize
  commands.push(Buffer.from([0x1B, 0x40])); // ESC @
  
  // Switch to raster mode
  commands.push(Buffer.from([0x1B, 0x69, 0x61, 0x01])); // ESC i a 1
  
  // Print information command
  commands.push(Buffer.from([0x1B, 0x69, 0x7A])); // ESC i z
  
  // Media type and dimensions for 62mm continuous
  const mediaInfo = Buffer.from([
    0x86,       // Valid flags (PI_KIND | PI_WIDTH | PI_LENGTH)
    0x0A,       // Media type: Continuous length tape
    0x3E,       // Media width: 62mm
    0x00,       // Media length (0 for continuous)
    0x00, 0x00, 0x00, 0x00, // Label height (pixels) - will set below
    0x00,       // Page number
    0x00        // Reserved
  ]);
  
  // Set label height based on size
  let labelHeight = 200; // pixels
  if (labelSize === 'compact') labelHeight = 150;
  else if (labelSize === 'large') labelHeight = 300;
  
  mediaInfo[4] = labelHeight & 0xFF;
  mediaInfo[5] = (labelHeight >> 8) & 0xFF;
  commands.push(mediaInfo);
  
  // Set margin (0)
  commands.push(Buffer.from([0x1B, 0x69, 0x64, 0x00, 0x00])); // ESC i d 0 0
  
  // Auto cut enabled
  commands.push(Buffer.from([0x1B, 0x69, 0x4D, 0x40])); // ESC i M - auto cut ON
  
  // Cut settings: cut at end
  commands.push(Buffer.from([0x1B, 0x69, 0x4B, 0x08])); // ESC i K - cut type
  
  // === Raster data ===
  // 62mm = 720 dots at 300 dpi, but we send 90 bytes per line (720 bits)
  const lineWidth = 90; // bytes per line (720 pixels)
  
  // Generate simple pattern with "TEST" text representation
  const timestamp = new Date().toLocaleString('fr-CA');
  
  for (let y = 0; y < labelHeight; y++) {
    // Raster line command
    commands.push(Buffer.from([0x67, 0x00, lineWidth])); // g 0 90
    
    const lineData = Buffer.alloc(lineWidth, 0x00);
    
    // Draw border on first and last 2 lines
    if (y < 3 || y >= labelHeight - 3) {
      lineData.fill(0xFF, 5, lineWidth - 5);
    }
    // Draw side borders
    else {
      lineData[5] = 0xFF;
      lineData[6] = 0xFF;
      lineData[lineWidth - 6] = 0xFF;
      lineData[lineWidth - 7] = 0xFF;
    }
    
    // Draw "TEST" pattern in the middle area (simplified block letters)
    if (y >= 30 && y < 80) {
      const row = y - 30;
      // T
      if (row < 8) lineData[15] = 0xFF; lineData[16] = 0xFF; lineData[17] = 0xFF;
      if (row >= 8) { lineData[16] = 0xFF; }
      // E
      lineData[22] = 0xFF;
      if (row < 8 || row > 42 || (row > 20 && row < 28)) { lineData[23] = 0xFF; lineData[24] = 0xFF; }
      // S
      if (row < 8 || (row > 20 && row < 28) || row > 42) { lineData[28] = 0xFF; lineData[29] = 0xFF; lineData[30] = 0xFF; }
      else if (row <= 20) lineData[28] = 0xFF;
      else lineData[30] = 0xFF;
      // T
      if (row < 8) { lineData[34] = 0xFF; lineData[35] = 0xFF; lineData[36] = 0xFF; }
      else lineData[35] = 0xFF;
    }
    
    // Freeman Solutions text area (simple line)
    if (y >= 120 && y < 125) {
      lineData.fill(0xAA, 20, 70); // Dotted line pattern
    }
    
    commands.push(lineData);
  }
  
  // Print with cut command
  commands.push(Buffer.from([0x1A])); // Print and cut
  
  return Buffer.concat(commands);
}

// Police bitmap simple 5x7 pour les caractères imprimables
const FONT_5X7 = {
  ' ': [0x00,0x00,0x00,0x00,0x00],
  '0': [0x3E,0x51,0x49,0x45,0x3E], '1': [0x00,0x42,0x7F,0x40,0x00],
  '2': [0x42,0x61,0x51,0x49,0x46], '3': [0x21,0x41,0x45,0x4B,0x31],
  '4': [0x18,0x14,0x12,0x7F,0x10], '5': [0x27,0x45,0x45,0x45,0x39],
  '6': [0x3C,0x4A,0x49,0x49,0x30], '7': [0x01,0x71,0x09,0x05,0x03],
  '8': [0x36,0x49,0x49,0x49,0x36], '9': [0x06,0x49,0x49,0x29,0x1E],
  'A': [0x7E,0x11,0x11,0x11,0x7E], 'B': [0x7F,0x49,0x49,0x49,0x36],
  'C': [0x3E,0x41,0x41,0x41,0x22], 'D': [0x7F,0x41,0x41,0x22,0x1C],
  'E': [0x7F,0x49,0x49,0x49,0x41], 'F': [0x7F,0x09,0x09,0x09,0x01],
  'G': [0x3E,0x41,0x49,0x49,0x7A], 'H': [0x7F,0x08,0x08,0x08,0x7F],
  'I': [0x00,0x41,0x7F,0x41,0x00], 'J': [0x20,0x40,0x41,0x3F,0x01],
  'K': [0x7F,0x08,0x14,0x22,0x41], 'L': [0x7F,0x40,0x40,0x40,0x40],
  'M': [0x7F,0x02,0x0C,0x02,0x7F], 'N': [0x7F,0x04,0x08,0x10,0x7F],
  'O': [0x3E,0x41,0x41,0x41,0x3E], 'P': [0x7F,0x09,0x09,0x09,0x06],
  'Q': [0x3E,0x41,0x51,0x21,0x5E], 'R': [0x7F,0x09,0x19,0x29,0x46],
  'S': [0x46,0x49,0x49,0x49,0x31], 'T': [0x01,0x01,0x7F,0x01,0x01],
  'U': [0x3F,0x40,0x40,0x40,0x3F], 'V': [0x1F,0x20,0x40,0x20,0x1F],
  'W': [0x3F,0x40,0x38,0x40,0x3F], 'X': [0x63,0x14,0x08,0x14,0x63],
  'Y': [0x07,0x08,0x70,0x08,0x07], 'Z': [0x61,0x51,0x49,0x45,0x43],
  '-': [0x08,0x08,0x08,0x08,0x08], '.': [0x00,0x60,0x60,0x00,0x00],
  '#': [0x14,0x7F,0x14,0x7F,0x14], '/': [0x20,0x10,0x08,0x04,0x02],
};

/**
 * Dessine un caractère sur le buffer de ligne (miroir horizontal pour Brother QL)
 */
function drawChar(lineData, char, x, y, currentY, scale = 2) {
  const glyph = FONT_5X7[char.toUpperCase()] || FONT_5X7[' '];
  const charHeight = 7 * scale;
  const LINE_WIDTH_PX = 720;
  
  if (currentY < y || currentY >= y + charHeight) return;
  
  const row = Math.floor((currentY - y) / scale);
  
  for (let col = 0; col < 5; col++) {
    const bit = (glyph[col] >> row) & 1;
    if (bit) {
      for (let sx = 0; sx < scale; sx++) {
        const pixelX = x + col * scale + sx;
        // Miroir horizontal: inverser la position X
        const mirroredX = LINE_WIDTH_PX - 1 - pixelX;
        const byteIndex = Math.floor(mirroredX / 8);
        const bitIndex = 7 - (mirroredX % 8);
        if (byteIndex >= 0 && byteIndex < lineData.length) {
          lineData[byteIndex] |= (1 << bitIndex);
        }
      }
    }
  }
}

/**
 * Dessine une chaîne de texte
 */
function drawText(lineData, text, x, y, currentY, scale = 2) {
  const charWidth = 6 * scale; // 5 pixels + 1 espace
  for (let i = 0; i < text.length; i++) {
    drawChar(lineData, text[i], x + i * charWidth, y, currentY, scale);
  }
}

/**
 * Génère une étiquette QR code pour Brother QL-710W
 * Formats:
 * - compact: QR à gauche + numéro à droite (62x30mm)
 * - standard: QR à gauche + titre + numéro à droite (62x40mm)  
 * - large: QR centré + titre + numéro en dessous (62x62mm)
 */
async function generateQrLabel(qrData, labelSize = 'standard', productName = '', productNumber = '') {
  // Configuration - hauteurs en pixels (300 DPI: 1mm ≈ 12px)
  const sizes = {
    compact:  { height: 360, qrSize: 280, layout: 'row' },   // 30mm
    standard: { height: 480, qrSize: 340, layout: 'row' },   // 40mm
    large:    { height: 744, qrSize: 480, layout: 'column' } // 62mm
  };
  const cfg = sizes[labelSize] || sizes.standard;
  
  // Générer le QR code
  const qrMatrix = await QRCode.create(qrData, { 
    errorCorrectionLevel: 'M',
    margin: 1
  });
  const qrModules = qrMatrix.modules;
  const qrModuleCount = qrModules.size;
  
  // Échelle du QR
  const scale = Math.floor(cfg.qrSize / qrModuleCount);
  const scaledQrSize = qrModuleCount * scale;
  
  const commands = [];
  const lineWidth = 90; // 720 pixels / 8 = 90 bytes
  const labelHeight = cfg.height;
  
  // === Initialisation Brother QL ===
  commands.push(Buffer.from([0x00].concat(Array(200).fill(0x00))));
  commands.push(Buffer.from([0x1B, 0x40])); // ESC @
  commands.push(Buffer.from([0x1B, 0x69, 0x61, 0x01])); // Raster mode
  commands.push(Buffer.from([0x1B, 0x69, 0x7A, 0x86, 0x0A, 0x3E, 0x00,
    labelHeight & 0xFF, (labelHeight >> 8) & 0xFF, 0x00, 0x00, 0x00, 0x00]));
  commands.push(Buffer.from([0x1B, 0x69, 0x64, 0x00, 0x00])); // Margin 0
  commands.push(Buffer.from([0x1B, 0x69, 0x4D, 0x40])); // Auto cut ON
  commands.push(Buffer.from([0x1B, 0x69, 0x4B, 0x08])); // Cut type
  
  // Positions selon le layout
  let qrStartX, qrStartY, textX, textY1, textY2, textScale;
  
  if (cfg.layout === 'row') {
    // QR à gauche, texte à droite
    qrStartX = 20;
    qrStartY = Math.floor((labelHeight - scaledQrSize) / 2);
    textX = qrStartX + scaledQrSize + 30;
    textY1 = Math.floor(labelHeight / 2) - 30; // Numéro ou titre
    textY2 = Math.floor(labelHeight / 2) + 10; // Numéro (si titre au-dessus)
    textScale = labelSize === 'compact' ? 3 : 2;
  } else {
    // QR centré en haut, texte en dessous
    qrStartX = Math.floor((720 - scaledQrSize) / 2);
    qrStartY = 20;
    textX = 40;
    textY1 = qrStartY + scaledQrSize + 30; // Titre
    textY2 = textY1 + 50; // Numéro
    textScale = 3;
  }
  
  // Préparer le texte
  const number = (productNumber || '').toString().substring(0, 15);
  const name = (productName || '').toString().substring(0, 25);
  
  // === Raster data ===
  for (let y = 0; y < labelHeight; y++) {
    commands.push(Buffer.from([0x67, 0x00, lineWidth]));
    const lineData = Buffer.alloc(lineWidth, 0x00);
    
    // Dessiner le QR code (miroir horizontal pour Brother QL)
    if (y >= qrStartY && y < qrStartY + scaledQrSize) {
      const qrY = Math.floor((y - qrStartY) / scale);
      for (let qrX = 0; qrX < qrModuleCount; qrX++) {
        const moduleIndex = qrY * qrModuleCount + qrX;
        if (qrModules.data[moduleIndex]) {
          for (let sx = 0; sx < scale; sx++) {
            const pixelX = qrStartX + qrX * scale + sx;
            // Miroir horizontal: inverser la position X
            const mirroredX = 720 - 1 - pixelX;
            const byteIndex = Math.floor(mirroredX / 8);
            const bitIndex = 7 - (mirroredX % 8);
            if (byteIndex < lineWidth) {
              lineData[byteIndex] |= (1 << bitIndex);
            }
          }
        }
      }
    }
    
    // Dessiner le texte
    if (cfg.layout === 'row') {
      if (labelSize === 'compact') {
        // Compact: titre (petit) + numéro (gros)
        drawText(lineData, name.substring(0, 15), textX, textY1 - 20, y, 2);
        drawText(lineData, '#' + number, textX, textY2, y, 3);
      } else {
        // Standard: titre + numéro
        drawText(lineData, name, textX, textY1, y, 2);
        drawText(lineData, '#' + number, textX, textY2, y, 3);
      }
    } else {
      // Large: titre centré + numéro centré
      const nameWidth = name.length * 6 * textScale;
      const numWidth = (number.length + 1) * 6 * textScale;
      drawText(lineData, name, Math.floor((720 - nameWidth) / 2), textY1, y, textScale);
      drawText(lineData, '#' + number, Math.floor((720 - numWidth) / 2), textY2, y, textScale);
    }
    
    commands.push(lineData);
  }
  
  // Print with cut
  commands.push(Buffer.from([0x1A]));
  
  return Buffer.concat(commands);
}

// Route d'impression QR code
app.post('/print/qr', authenticate, async (req, res) => {
  try {
    const { data, labelSize = 'medium', quantity = 1, productName, productNumber } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Données QR code requises' });
    }
    
    logger.info('Impression QR code demandée', { 
      labelSize, 
      quantity,
      dataLength: data.length,
      productNumber,
      ip: req.ip 
    });
    
    if (!printerClient) initPrinterClient();
    
    // Générer l'étiquette QR
    const labelData = await generateQrLabel(data, labelSize, productName, productNumber);
    
    // Envoyer à l'imprimante (pour chaque quantité)
    let totalBytesSent = 0;
    for (let i = 0; i < quantity; i++) {
      const result = await printerClient.sendRawData(labelData);
      totalBytesSent += result.bytesSent;
    }
    
    // Enregistrer le job dans les stats
    recordPrintJob('qr', quantity);
    
    logger.info('QR code imprimé', { bytesSent: totalBytesSent, quantity });
    
    res.json({
      success: true,
      message: `QR code envoyé à l'imprimante (${quantity} étiquette(s))`,
      jobId: `job_${Date.now()}`,
      labelSize,
      bytesSent: totalBytesSent,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erreur impression QR code', { error: error.message });
    res.status(500).json({ error: error.message || 'Échec de l\'impression' });
  }
});

// Route d'impression raw (données brutes à l'imprimante)
app.post('/print/raw', authenticate, async (req, res) => {
  try {
    const { data, encoding = 'base64' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Données requises' });
    }
    
    logger.info('Impression raw demandée', { 
      dataLength: data.length,
      encoding,
      ip: req.ip 
    });
    
    if (!printerClient) initPrinterClient();
    
    const buffer = encoding === 'base64' 
      ? Buffer.from(data, 'base64')
      : Buffer.from(data, encoding);
    
    const result = await printerClient.sendRawData(buffer);
    
    res.json({
      success: true,
      message: 'Données envoyées à l\'imprimante',
      jobId: `job_${Date.now()}`,
      bytesSent: result.bytesSent,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erreur impression raw', { error: error.message });
    res.status(500).json({ error: error.message || 'Échec de l\'impression' });
  }
});

// Gestion des erreurs 404
app.use((req, res) => {
  logger.warn('Route non trouvée', { path: req.path, method: req.method });
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
  logger.error('Erreur serveur', { 
    error: error.message, 
    stack: error.stack,
    path: req.path 
  });
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Freemen Printer Proxy démarré sur le port ${PORT}`);
  logger.info(`🖨️  Imprimante: ${PRINTER_IP}:${PRINTER_PORT} (${PRINTER_PROTOCOL})`);
  logger.info(`🌐 Dashboard: http://localhost:${PORT}`);
  logger.info(`🔑 Mode: ${API_KEY === 'dev-key-change-in-production' ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  
  // Créer le dossier logs s'il n'existe pas
  const fs = require('fs');
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  logger.info('Réception SIGTERM, arrêt propre...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Réception SIGINT, arrêt propre...');
  process.exit(0);
});

module.exports = app; // Pour les tests