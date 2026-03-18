/**
 * Module de génération de QR codes pour impression
 */

const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

class QRGenerator {
  constructor(config = {}) {
    this.config = {
      margin: config.margin || 0,
      color: config.color || '#000000',
      backgroundColor: config.backgroundColor || '#FFFFFF',
      errorCorrectionLevel: config.errorCorrectionLevel || 'M',
      ...config
    };
  }
  
  /**
   * Génère un QR code en tant que buffer image
   */
  async generateQRCodeBuffer(data, options = {}) {
    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel || this.config.errorCorrectionLevel,
      margin: options.margin || this.config.margin,
      color: {
        dark: options.color || this.config.color,
        light: options.backgroundColor || this.config.backgroundColor
      },
      width: options.width || 300,
      type: options.type || 'png'
    };
    
    try {
      const buffer = await QRCode.toBuffer(data, qrOptions);
      return buffer;
    } catch (error) {
      throw new Error(`Erreur génération QR code: ${error.message}`);
    }
  }
  
  /**
   * Génère un QR code en tant que Data URL
   */
  async generateQRCodeDataURL(data, options = {}) {
    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel || this.config.errorCorrectionLevel,
      margin: options.margin || this.config.margin,
      color: {
        dark: options.color || this.config.color,
        light: options.backgroundColor || this.config.backgroundColor
      },
      width: options.width || 300,
      type: options.type || 'png'
    };
    
    try {
      const dataURL = await QRCode.toDataURL(data, qrOptions);
      return dataURL;
    } catch (error) {
      throw new Error(`Erreur génération QR code: ${error.message}`);
    }
  }
  
  /**
   * Génère un PDF avec un QR code pour impression
   */
  async generatePDFWithQR(data, labelSize = 'medium', options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Dimensions en points (1 point = 1/72 inch)
        const dimensions = this.getLabelDimensions(labelSize);
        
        // Créer le document PDF
        const doc = new PDFDocument({
          size: [dimensions.width, dimensions.height],
          margin: 0,
          autoFirstPage: false
        });
        
        // Ajouter une page
        doc.addPage({
          size: [dimensions.width, dimensions.height],
          margin: 0
        });
        
        // Générer le QR code
        QRCode.toDataURL(data, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: dimensions.qrSize,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }, (error, qrDataURL) => {
          if (error) {
            reject(error);
            return;
          }
          
          // Calculer la position centrée
          const x = (dimensions.width - dimensions.qrSize) / 2;
          const y = (dimensions.height - dimensions.qrSize) / 2;
          
          // Ajouter le QR code au PDF
          doc.image(qrDataURL, x, y, {
            width: dimensions.qrSize,
            height: dimensions.qrSize
          });
          
          // Ajouter du texte optionnel
          if (options.text) {
            doc.fontSize(8)
               .text(options.text, 10, dimensions.height - 20, {
                 width: dimensions.width - 20,
                 align: 'center'
               });
          }
          
          // Finaliser le PDF
          doc.end();
          
          // Collecter les données PDF
          const chunks = [];
          doc.on('data', chunk => chunks.push(chunk));
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            resolve({
              buffer: pdfBuffer,
              dimensions,
              labelSize,
              dataLength: data.length
            });
          });
          
          doc.on('error', reject);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Retourne les dimensions pour une taille d'étiquette donnée
   */
  getLabelDimensions(labelSize) {
    const sizes = {
      small: {
        name: 'Small',
        width: 29, // mm
        height: 29, // mm
        description: '29×29mm (petite étiquette carrée)'
      },
      medium: {
        name: 'Medium',
        width: 62, // mm
        height: 29, // mm
        description: '62×29mm (étiquette horizontale standard)'
      },
      large: {
        name: 'Large',
        width: 62, // mm
        height: 62, // mm
        description: '62×62mm (grande étiquette carrée)'
      }
    };
    
    const size = sizes[labelSize.toLowerCase()] || sizes.medium;
    
    // Convertir mm en points (1 mm = 2.83465 points)
    const mmToPoints = (mm) => mm * 2.83465;
    
    return {
      ...size,
      widthPoints: mmToPoints(size.width),
      heightPoints: mmToPoints(size.height),
      qrSize: mmToPoints(size.width * 0.8) // QR code à 80% de la largeur
    };
  }
  
  /**
   * Génère des commandes ESC/P pour imprimer un QR code directement
   * (Pour impression directe via socket sans PDF)
   */
  async generateESCPQRCode(data, labelSize = 'medium') {
    // À implémenter avec la documentation Brother ESC/P
    // Pour l'instant, retourne un stub
    const dimensions = this.getLabelDimensions(labelSize);
    
    // Commandes ESC/P de base
    let escpCommands = '';
    
    // Initialisation
    escpCommands += '\x1B@'; // Initialize
    
    // Sélectionner la taille d'étiquette
    switch (labelSize.toLowerCase()) {
      case 'small':
        escpCommands += '\x1BiL\x01'; // Small label
        break;
      case 'medium':
        escpCommands += '\x1BiL\x02'; // Medium label
        break;
      case 'large':
        escpCommands += '\x1BiL\x03'; // Large label
        break;
    }
    
    // Générer le QR code (simplifié)
    // En réalité, il faudrait utiliser les commandes Brother spécifiques
    escpCommands += `\x1B2D2,${data.length},${data}`; // QR code command (exemple)
    
    // Couper l'étiquette
    escpCommands += '\x1BiK'; // Cut
    
    return {
      commands: Buffer.from(escpCommands, 'ascii'),
      dimensions,
      labelSize
    };
  }
}

module.exports = QRGenerator;