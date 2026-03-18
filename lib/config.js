/**
 * Système de persistance de configuration pour le printer-proxy
 * Stocke les paramètres de l'imprimante dans un fichier JSON
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'printer-config.json');

// Configuration par défaut
const DEFAULT_CONFIG = {
  printer: {
    ip: process.env.PRINTER_IP || '192.168.1.100',
    port: parseInt(process.env.PRINTER_PORT, 10) || 9100,
    protocol: process.env.PRINTER_PROTOCOL || 'jetdirect',
    model: null,
    name: 'Imprimante par défaut',
    autoDetected: false
  },
  savedPrinters: [],
  preferences: {
    defaultLabelSize: 'moyen',
    autoCut: true,
    copies: 1
  },
  lastScan: null,
  version: 1
};

/**
 * S'assurer que le dossier data existe
 */
function ensureDataDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Charger la configuration depuis le fichier
 */
function loadConfig() {
  ensureDataDir();
  
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      
      // Merger avec les valeurs par défaut pour les nouvelles propriétés
      return {
        ...DEFAULT_CONFIG,
        ...config,
        printer: { ...DEFAULT_CONFIG.printer, ...config.printer },
        preferences: { ...DEFAULT_CONFIG.preferences, ...config.preferences }
      };
    }
  } catch (error) {
    console.error('Erreur chargement config:', error.message);
  }
  
  return { ...DEFAULT_CONFIG };
}

/**
 * Sauvegarder la configuration
 */
function saveConfig(config) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde config:', error.message);
    return false;
  }
}

/**
 * Obtenir la configuration actuelle
 */
function getConfig() {
  return loadConfig();
}

/**
 * Mettre à jour la configuration de l'imprimante active
 */
function setActivePrinter(printerConfig) {
  const config = loadConfig();
  
  config.printer = {
    ...config.printer,
    ...printerConfig,
    updatedAt: new Date().toISOString()
  };
  
  saveConfig(config);
  return config.printer;
}

/**
 * Ajouter une imprimante aux favoris
 */
function savePrinter(printer) {
  const config = loadConfig();
  
  // Vérifier si déjà présente
  const existingIndex = config.savedPrinters.findIndex(p => p.ip === printer.ip);
  
  const printerEntry = {
    ...printer,
    savedAt: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    config.savedPrinters[existingIndex] = printerEntry;
  } else {
    config.savedPrinters.push(printerEntry);
  }
  
  saveConfig(config);
  return config.savedPrinters;
}

/**
 * Supprimer une imprimante des favoris
 */
function removeSavedPrinter(ip) {
  const config = loadConfig();
  config.savedPrinters = config.savedPrinters.filter(p => p.ip !== ip);
  saveConfig(config);
  return config.savedPrinters;
}

/**
 * Obtenir les imprimantes sauvegardées
 */
function getSavedPrinters() {
  const config = loadConfig();
  return config.savedPrinters;
}

/**
 * Mettre à jour les préférences
 */
function updatePreferences(prefs) {
  const config = loadConfig();
  config.preferences = { ...config.preferences, ...prefs };
  saveConfig(config);
  return config.preferences;
}

/**
 * Enregistrer le résultat d'un scan
 */
function recordScanResults(results) {
  const config = loadConfig();
  config.lastScan = {
    timestamp: new Date().toISOString(),
    foundCount: results.length,
    printers: results
  };
  saveConfig(config);
  return config.lastScan;
}

/**
 * Obtenir le dernier scan
 */
function getLastScan() {
  const config = loadConfig();
  return config.lastScan;
}

/**
 * Réinitialiser la configuration
 */
function resetConfig() {
  const config = { ...DEFAULT_CONFIG };
  saveConfig(config);
  return config;
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfig,
  setActivePrinter,
  savePrinter,
  removeSavedPrinter,
  getSavedPrinters,
  updatePreferences,
  recordScanResults,
  getLastScan,
  resetConfig,
  DEFAULT_CONFIG
};
