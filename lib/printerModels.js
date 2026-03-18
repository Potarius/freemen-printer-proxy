/**
 * Configuration des modèles d'imprimantes Brother compatibles
 * Inclut les specs techniques et capacités de chaque modèle
 */

const BROTHER_MODELS = {
  // ===== Série QL (Label Printers) =====
  'QL-500': {
    series: 'QL',
    name: 'QL-500',
    maxWidth: 62,
    dpi: 300,
    speed: '50mm/s',
    connection: ['USB'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: false,
    notes: 'Modèle d\'entrée de gamme'
  },
  'QL-550': {
    series: 'QL',
    name: 'QL-550',
    maxWidth: 62,
    dpi: 300,
    speed: '50mm/s',
    connection: ['USB'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: false,
    notes: 'Avec détection automatique du média'
  },
  'QL-570': {
    series: 'QL',
    name: 'QL-570',
    maxWidth: 62,
    dpi: 300,
    speed: '68mm/s',
    connection: ['USB'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: false,
    notes: 'Version améliorée du QL-550'
  },
  'QL-700': {
    series: 'QL',
    name: 'QL-700',
    maxWidth: 62,
    dpi: 300,
    speed: '93mm/s',
    connection: ['USB'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: false,
    notes: 'Haute vitesse, USB seulement'
  },
  'QL-710W': {
    series: 'QL',
    name: 'QL-710W',
    maxWidth: 62,
    dpi: 300,
    speed: '93mm/s',
    connection: ['USB', 'WiFi'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: false,
    notes: 'WiFi intégré, impression mobile'
  },
  'QL-720NW': {
    series: 'QL',
    name: 'QL-720NW',
    maxWidth: 62,
    dpi: 300,
    speed: '93mm/s',
    connection: ['USB', 'Ethernet', 'WiFi'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: false,
    notes: 'WiFi + Ethernet, idéal réseau'
  },
  'QL-800': {
    series: 'QL',
    name: 'QL-800',
    maxWidth: 62,
    dpi: 300,
    speed: '93mm/s',
    connection: ['USB'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: true,
    notes: 'Impression noir et rouge!'
  },
  'QL-810W': {
    series: 'QL',
    name: 'QL-810W',
    maxWidth: 62,
    dpi: 300,
    speed: '110mm/s',
    connection: ['USB', 'WiFi'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: true,
    notes: 'WiFi + impression deux couleurs'
  },
  'QL-820NWB': {
    series: 'QL',
    name: 'QL-820NWB',
    maxWidth: 62,
    dpi: 300,
    speed: '110mm/s',
    connection: ['USB', 'Ethernet', 'WiFi', 'Bluetooth'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: true,
    notes: 'Toutes connectivités + 2 couleurs'
  },
  'QL-1100': {
    series: 'QL',
    name: 'QL-1100',
    maxWidth: 102,
    dpi: 300,
    speed: '69mm/s',
    connection: ['USB'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: false,
    notes: 'Format large 4" (102mm)'
  },
  'QL-1110NWB': {
    series: 'QL',
    name: 'QL-1110NWB',
    maxWidth: 102,
    dpi: 300,
    speed: '69mm/s',
    connection: ['USB', 'Ethernet', 'WiFi', 'Bluetooth'],
    continuous: true,
    dieCut: true,
    cutter: true,
    twoColor: false,
    notes: 'Format large + toutes connectivités'
  },

  // ===== Série TD (Desktop Thermal) =====
  'TD-4410D': {
    series: 'TD',
    name: 'TD-4410D',
    maxWidth: 118,
    dpi: 203,
    speed: '203mm/s',
    connection: ['USB', 'Serial'],
    continuous: true,
    dieCut: true,
    cutter: false,
    twoColor: false,
    notes: 'Thermique directe, haute vitesse'
  },
  'TD-4420DN': {
    series: 'TD',
    name: 'TD-4420DN',
    maxWidth: 118,
    dpi: 203,
    speed: '203mm/s',
    connection: ['USB', 'Ethernet', 'Serial'],
    continuous: true,
    dieCut: true,
    cutter: false,
    twoColor: false,
    notes: 'Avec Ethernet intégré'
  },
  'TD-4520DN': {
    series: 'TD',
    name: 'TD-4520DN',
    maxWidth: 118,
    dpi: 300,
    speed: '152mm/s',
    connection: ['USB', 'Ethernet', 'Serial'],
    continuous: true,
    dieCut: true,
    cutter: false,
    twoColor: false,
    notes: 'Haute résolution 300dpi'
  },
  'TD-4550DNWB': {
    series: 'TD',
    name: 'TD-4550DNWB',
    maxWidth: 118,
    dpi: 300,
    speed: '152mm/s',
    connection: ['USB', 'Ethernet', 'WiFi', 'Bluetooth', 'Serial'],
    continuous: true,
    dieCut: true,
    cutter: false,
    twoColor: false,
    notes: 'Toutes connectivités, pro'
  }
};

// Tailles d'étiquettes standards Brother
const LABEL_SIZES = {
  // Étiquettes continues
  continuous: [
    { id: '12', width: 12, description: '12mm continu' },
    { id: '29', width: 29, description: '29mm continu' },
    { id: '38', width: 38, description: '38mm continu' },
    { id: '50', width: 50, description: '50mm continu' },
    { id: '54', width: 54, description: '54mm continu' },
    { id: '62', width: 62, description: '62mm continu' },
    { id: '102', width: 102, description: '102mm continu (QL-1100+)' }
  ],
  // Étiquettes pré-découpées (die-cut)
  dieCut: [
    { id: '17x54', width: 17, height: 54, description: '17×54mm adresse retour' },
    { id: '23x23', width: 23, height: 23, description: '23×23mm carré petit' },
    { id: '29x42', width: 29, height: 42, description: '29×42mm multi-usage' },
    { id: '29x90', width: 29, height: 90, description: '29×90mm adresse' },
    { id: '38x90', width: 38, height: 90, description: '38×90mm adresse large' },
    { id: '39x48', width: 39, height: 48, description: '39×48mm multi-usage' },
    { id: '52x29', width: 52, height: 29, description: '52×29mm code-barres' },
    { id: '62x29', width: 62, height: 29, description: '62×29mm adresse large' },
    { id: '62x100', width: 62, height: 100, description: '62×100mm expédition' },
    { id: '102x51', width: 102, height: 51, description: '102×51mm (QL-1100+)' },
    { id: '102x152', width: 102, height: 152, description: '102×152mm expédition (QL-1100+)' }
  ]
};

// Presets de configuration pour impression
const PRINT_PRESETS = {
  petit: {
    name: 'Petit',
    description: '29×29mm - QR code + numéro',
    width: 29,
    height: 29,
    labelType: 'continuous'
  },
  moyen: {
    name: 'Moyen',
    description: '62×29mm - QR + nom + numéro (paysage)',
    width: 62,
    height: 29,
    labelType: 'continuous'
  },
  grand: {
    name: 'Grand',
    description: '62×62mm - QR + nom + numéro (carré)',
    width: 62,
    height: 62,
    labelType: 'continuous'
  },
  expedition: {
    name: 'Expédition',
    description: '62×100mm - Étiquette complète',
    width: 62,
    height: 100,
    labelType: 'dieCut'
  }
};

/**
 * Obtient la liste des modèles compatibles avec la connexion réseau
 */
function getNetworkCompatibleModels() {
  return Object.values(BROTHER_MODELS).filter(model => 
    model.connection.includes('WiFi') || 
    model.connection.includes('Ethernet')
  );
}

/**
 * Obtient les specs d'un modèle
 */
function getModelSpecs(modelName) {
  return BROTHER_MODELS[modelName] || null;
}

/**
 * Vérifie si un modèle supporte une largeur d'étiquette
 */
function supportsWidth(modelName, width) {
  const model = BROTHER_MODELS[modelName];
  return model ? width <= model.maxWidth : false;
}

/**
 * Obtient les tailles d'étiquettes supportées par un modèle
 */
function getSupportedLabelSizes(modelName) {
  const model = BROTHER_MODELS[modelName];
  if (!model) return { continuous: [], dieCut: [] };

  return {
    continuous: LABEL_SIZES.continuous.filter(l => l.width <= model.maxWidth),
    dieCut: model.dieCut ? LABEL_SIZES.dieCut.filter(l => l.width <= model.maxWidth) : []
  };
}

module.exports = {
  BROTHER_MODELS,
  LABEL_SIZES,
  PRINT_PRESETS,
  getNetworkCompatibleModels,
  getModelSpecs,
  supportsWidth,
  getSupportedLabelSizes
};
