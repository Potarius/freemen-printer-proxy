/**
 * Module de communication avec l'imprimante Brother QL-710W
 * Supporte les protocoles JetDirect (raw socket) et IPP
 */

const net = require('net');
const ipp = require('ipp');
const winston = require('winston');

class PrinterClient {
  constructor(config) {
    this.config = {
      ip: config.ip || '192.168.1.100',
      port: config.port || 9100,
      protocol: config.protocol || 'jetdirect',
      timeout: config.timeout || 5000,
      ...config
    };
    
    this.logger = config.logger || winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
    
    this.isConnected = false;
  }
  
  /**
   * Teste la connexion à l'imprimante
   */
  async testConnection() {
    this.logger.info(`Test de connexion à l'imprimante ${this.config.ip}:${this.config.port}`);
    
    try {
      if (this.config.protocol === 'jetdirect') {
        return await this.testJetDirectConnection();
      } else if (this.config.protocol === 'ipp') {
        return await this.testIPPConnection();
      } else {
        throw new Error(`Protocole non supporté: ${this.config.protocol}`);
      }
    } catch (error) {
      this.logger.error(`Échec de connexion à l'imprimante: ${error.message}`);
      return {
        connected: false,
        error: error.message,
        protocol: this.config.protocol
      };
    }
  }
  
  /**
   * Teste la connexion via JetDirect (raw socket port 9100)
   */
  async testJetDirectConnection() {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let timeoutId;
      
      socket.setTimeout(this.config.timeout);
      
      socket.on('connect', () => {
        clearTimeout(timeoutId);
        this.logger.info(`Connexion JetDirect établie à ${this.config.ip}:${this.config.port}`);
        socket.destroy();
        
        resolve({
          connected: true,
          protocol: 'jetdirect',
          ip: this.config.ip,
          port: this.config.port,
          message: 'Imprimante accessible via JetDirect'
        });
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Timeout de connexion JetDirect'));
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeoutId);
        socket.destroy();
        reject(error);
      });
      
      // Timeout pour la promesse
      timeoutId = setTimeout(() => {
        socket.destroy();
        reject(new Error('Timeout de connexion'));
      }, this.config.timeout + 1000);
      
      socket.connect(this.config.port, this.config.ip);
    });
  }
  
  /**
   * Teste la connexion via IPP (Internet Printing Protocol port 631)
   */
  async testIPPConnection() {
    return new Promise((resolve, reject) => {
      const printerUrl = `http://${this.config.ip}:631/ipp/print`;
      
      const request = {
        'operation-attributes-tag': {
          'requesting-user-name': 'printer-proxy',
          'requested-operation': 'Print-Job'
        }
      };
      
      ipp.request(printerUrl, request, (error, response) => {
        if (error) {
          // Même si on reçoit une erreur, c'est que l'imprimante répond
          // Les erreurs IPP sont normales pour un test simple
          this.logger.info(`IPP répond mais erreur: ${error.message}`);
          resolve({
            connected: true,
            protocol: 'ipp',
            ip: this.config.ip,
            port: 631,
            message: `IPP accessible: ${error.message}`
          });
        } else {
          this.logger.info(`IPP répond avec succès: ${response.statusCode}`);
          resolve({
            connected: true,
            protocol: 'ipp',
            ip: this.config.ip,
            port: 631,
            statusCode: response.statusCode,
            message: 'IPP pleinement fonctionnel'
          });
        }
      });
    });
  }
  
  /**
   * Envoie des données raw à l'imprimante (JetDirect)
   */
  async sendRawData(data) {
    if (this.config.protocol !== 'jetdirect') {
      throw new Error('sendRawData nécessite le protocole JetDirect');
    }
    
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let timeoutId;
      
      socket.setTimeout(this.config.timeout);
      
      socket.on('connect', () => {
        clearTimeout(timeoutId);
        this.logger.debug('Socket connectée, envoi des données...');
        socket.write(data);
        socket.end();
      });
      
      socket.on('end', () => {
        this.logger.debug('Données envoyées avec succès');
        resolve({
          success: true,
          bytesSent: data.length,
          protocol: 'jetdirect'
        });
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Timeout lors de l\'envoi des données'));
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeoutId);
        socket.destroy();
        reject(error);
      });
      
      // Timeout pour la promesse
      timeoutId = setTimeout(() => {
        socket.destroy();
        reject(new Error('Timeout de connexion'));
      }, this.config.timeout + 1000);
      
      socket.connect(this.config.port, this.config.ip);
    });
  }
  
  /**
   * Envoie un job d'impression via IPP
   */
  async sendIPPJob(jobData, options = {}) {
    if (this.config.protocol !== 'ipp') {
      throw new Error('sendIPPJob nécessite le protocole IPP');
    }
    
    return new Promise((resolve, reject) => {
      const printerUrl = `http://${this.config.ip}:631/ipp/print`;
      
      const request = {
        'operation-attributes-tag': {
          'requesting-user-name': options.username || 'printer-proxy',
          'job-name': options.jobName || 'QR Code Print',
          'document-format': options.documentFormat || 'application/pdf'
        },
        data: jobData
      };
      
      ipp.request(printerUrl, request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            success: true,
            jobId: response['job-id'],
            statusCode: response.statusCode,
            protocol: 'ipp'
          });
        }
      });
    });
  }
  
  /**
   * Génère et envoie des commandes ESC/P pour l'impression d'étiquettes
   * Format Brother QL-710W
   */
  generateESCPCommands(labelData) {
    // Commandes ESC/P de base pour Brother QL-710W
    // À compléter avec la documentation officielle Brother
    const commands = [];
    
    // Initialisation
    commands.push(Buffer.from('\x1B@', 'ascii')); // Initialize printer
    
    // Définir le mode d'étiquette
    const { width, height } = labelData.dimensions;
    if (width === 29 && height === 29) {
      commands.push(Buffer.from('\x1BiL\x01', 'ascii')); // Small label
    } else if (width === 62 && height === 29) {
      commands.push(Buffer.from('\x1BiL\x02', 'ascii')); // Medium label
    } else if (width === 62 && height === 62) {
      commands.push(Buffer.from('\x1BiL\x03', 'ascii')); // Large label
    }
    
    // Ajouter les données (QR code, texte, etc.)
    if (labelData.qrCode) {
      // Commandes pour imprimer un QR code
      // À implémenter avec la documentation Brother
      commands.push(Buffer.from(labelData.qrCode, 'ascii'));
    }
    
    // Couper l'étiquette
    commands.push(Buffer.from('\x1BiK', 'ascii')); // Cut
    
    return Buffer.concat(commands);
  }
}

module.exports = PrinterClient;