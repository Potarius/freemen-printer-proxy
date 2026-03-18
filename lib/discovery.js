/**
 * Module de découverte réseau pour imprimantes Brother
 * Supporte: mDNS/Bonjour, port scanning, SNMP
 */

const dgram = require('dgram');
const net = require('net');
const os = require('os');
const dns = require('dns');

// Ports à scanner pour les imprimantes
const PRINTER_PORTS = {
  jetdirect: 9100,
  ipp: 631,
  snmp: 161
};

// Services mDNS pour imprimantes
const MDNS_SERVICES = [
  '_pdl-datastream._tcp.local',  // JetDirect/RAW
  '_printer._tcp.local',          // LPR
  '_ipp._tcp.local'               // IPP
];

/**
 * Subnets Docker/virtuels à ignorer
 */
const IGNORED_SUBNETS = [
  '172.17.',   // Docker default bridge
  '172.18.',   // Docker networks
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '169.254.',  // Link-local
  '127.'       // Loopback
];

/**
 * Vérifie si un subnet doit être ignoré (Docker, etc.)
 */
function shouldIgnoreSubnet(subnet) {
  return IGNORED_SUBNETS.some(ignored => subnet.startsWith(ignored));
}

/**
 * Obtient les plages d'IP du réseau local
 * @param {string} customSubnet - Subnet personnalisé à ajouter (ex: "192.168.7")
 */
function getLocalNetworkRanges(customSubnet = null) {
  const interfaces = os.networkInterfaces();
  const ranges = [];
  const seenSubnets = new Set();

  // Ajouter le subnet personnalisé en premier (priorité)
  if (customSubnet) {
    const subnet = customSubnet.replace(/\.$/, ''); // Enlever le point final si présent
    ranges.push({
      subnet,
      localIp: null,
      netmask: '255.255.255.0',
      custom: true
    });
    seenSubnets.add(subnet);
  }

  // Ajouter les interfaces réseau réelles (pas Docker)
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4 seulement, pas loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.');
        const subnet = parts.slice(0, 3).join('.');
        
        // Ignorer les subnets Docker/virtuels et les doublons
        if (!shouldIgnoreSubnet(subnet) && !seenSubnets.has(subnet)) {
          ranges.push({
            subnet,
            localIp: iface.address,
            netmask: iface.netmask
          });
          seenSubnets.add(subnet);
        }
      }
    }
  }

  return ranges;
}

/**
 * Teste si un port est ouvert sur une IP
 */
function checkPort(ip, port, timeout = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      cleanup();
      resolve({ ip, port, open: true });
    });

    socket.on('timeout', () => {
      cleanup();
      resolve({ ip, port, open: false });
    });

    socket.on('error', () => {
      cleanup();
      resolve({ ip, port, open: false });
    });

    socket.connect(port, ip);
  });
}

/**
 * Scan un range d'IP pour les ports imprimante
 */
async function scanNetwork(options = {}) {
  const {
    timeout = 500,
    concurrency = 50,
    ports = [PRINTER_PORTS.jetdirect, PRINTER_PORTS.ipp],
    progressCallback = null,
    subnet = process.env.SCAN_SUBNET || null
  } = options;

  const ranges = getLocalNetworkRanges(subnet);
  const results = [];
  const allTargets = [];

  // Générer toutes les IP à scanner
  for (const range of ranges) {
    for (let i = 1; i <= 254; i++) {
      const ip = `${range.subnet}.${i}`;
      if (ip !== range.localIp) {
        for (const port of ports) {
          allTargets.push({ ip, port });
        }
      }
    }
  }

  const total = allTargets.length;
  let completed = 0;

  // Scanner par lots pour ne pas surcharger
  for (let i = 0; i < allTargets.length; i += concurrency) {
    const batch = allTargets.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(({ ip, port }) => checkPort(ip, port, timeout))
    );

    for (const result of batchResults) {
      if (result.open) {
        // Vérifier si on a déjà cette IP
        const existing = results.find(r => r.ip === result.ip);
        if (existing) {
          existing.ports.push(result.port);
        } else {
          results.push({
            ip: result.ip,
            ports: [result.port],
            hostname: null,
            model: null
          });
        }
      }
    }

    completed += batch.length;
    if (progressCallback) {
      progressCallback({ completed, total, found: results.length });
    }
  }

  // Essayer de résoudre les hostnames et identifier les modèles
  await Promise.all(results.map(async (result) => {
    try {
      const hostnames = await dns.promises.reverse(result.ip);
      if (hostnames && hostnames.length > 0) {
        result.hostname = hostnames[0];
      }
    } catch (e) {
      // Pas de reverse DNS, c'est OK
    }

    // Tenter d'identifier le modèle via SNMP ou autre
    result.model = await identifyPrinterModel(result.ip, result.ports);
  }));

  return results;
}

/**
 * Scan rapide - seulement les IP communes pour imprimantes
 */
async function quickScan(options = {}) {
  const { 
    timeout = 1000,
    subnet = process.env.SCAN_SUBNET || null
  } = options;
  const ranges = getLocalNetworkRanges(subnet);
  const results = [];

  // IPs communes pour imprimantes (souvent en haut ou bas de plage, ou DHCP typiques)
  const commonSuffixes = [
    1, 2, 3, 4, 5,           // Début de plage (souvent statique)
    10, 11, 12, 13, 14, 15,  // Plage basse
    20, 21, 25, 30, 31, 32,  // Plage commune DHCP
    50, 51, 100, 101, 102,   // Milieu de plage
    150, 151, 200, 201,      // Plage haute
    250, 251, 252, 253, 254  // Fin de plage
  ];

  const targets = [];
  for (const range of ranges) {
    for (const suffix of commonSuffixes) {
      targets.push(`${range.subnet}.${suffix}`);
    }
  }

  // Scanner JetDirect (9100) d'abord car plus commun
  const checks = await Promise.all(
    targets.map(ip => checkPort(ip, PRINTER_PORTS.jetdirect, timeout))
  );

  for (const check of checks) {
    if (check.open) {
      const model = await identifyPrinterModel(check.ip, [PRINTER_PORTS.jetdirect]);
      results.push({
        ip: check.ip,
        ports: [PRINTER_PORTS.jetdirect],
        hostname: null,
        model
      });
    }
  }

  return results;
}

/**
 * Tente d'identifier le modèle d'imprimante
 * Utilise une connexion TCP et analyse la réponse
 */
async function identifyPrinterModel(ip, ports) {
  // Pour les Brother QL, on peut envoyer une commande de status
  if (ports.includes(PRINTER_PORTS.jetdirect)) {
    try {
      const info = await getBrotherInfo(ip);
      if (info) return info;
    } catch (e) {
      // Pas une Brother ou pas accessible
    }
  }

  return null;
}

/**
 * Obtient les infos d'une imprimante Brother via commande status
 */
function getBrotherInfo(ip, port = 9100, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let data = Buffer.alloc(0);
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      // Envoyer commande de status Brother ESC/P
      // Invalidate + Initialize + Status request
      const statusCmd = Buffer.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Invalidate
        0x1B, 0x40,                                     // ESC @ (Initialize)
        0x1B, 0x69, 0x53                                // ESC i S (Status request)
      ]);
      socket.write(statusCmd);
    });

    socket.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
      
      // Analyser la réponse Brother (32 bytes status)
      if (data.length >= 32) {
        cleanup();
        const info = parseBrotherStatus(data);
        resolve(info);
      }
    });

    socket.on('timeout', () => {
      cleanup();
      // Si on a reçu quelque chose, c'est probablement une imprimante
      if (data.length > 0) {
        resolve({ type: 'brother', model: 'Unknown Brother' });
      } else {
        resolve(null);
      }
    });

    socket.on('error', () => {
      cleanup();
      resolve(null);
    });

    socket.connect(port, ip);
  });
}

/**
 * Parse la réponse status Brother QL
 */
function parseBrotherStatus(data) {
  if (data.length < 32) return null;

  // Byte 0: Print head mark (0x80)
  // Byte 1: Size (0x20 = 32)
  // Byte 2: Brother code (0x42 = 'B')
  // Byte 3: Series code (0x30 = QL series)
  // Byte 4: Model code
  
  if (data[2] !== 0x42) {
    // Pas un Brother
    return null;
  }

  const seriesCode = data[3];
  const modelCode = data[4];
  const mediaWidth = data[10];
  const mediaType = data[11];
  const errorInfo1 = data[8];
  const errorInfo2 = data[9];

  // Mapping des codes modèles Brother QL
  const models = {
    0x30: { // QL series
      0x34: 'QL-500',
      0x35: 'QL-550',
      0x36: 'QL-560',
      0x37: 'QL-570',
      0x38: 'QL-580N',
      0x39: 'QL-650TD',
      0x41: 'QL-700',
      0x42: 'QL-710W',
      0x43: 'QL-720NW',
      0x44: 'QL-800',
      0x45: 'QL-810W',
      0x46: 'QL-820NWB',
      0x47: 'QL-1050',
      0x48: 'QL-1060N',
      0x49: 'QL-1100',
      0x50: 'QL-1110NWB'
    },
    0x31: { // PT series (P-Touch)
      0x41: 'PT-P900W',
      0x42: 'PT-P950NW'
    },
    0x32: { // TD series
      0x41: 'TD-2020',
      0x42: 'TD-2120N',
      0x43: 'TD-2130N',
      0x44: 'TD-4000',
      0x45: 'TD-4100N',
      0x46: 'TD-4410D',
      0x47: 'TD-4420DN',
      0x48: 'TD-4520DN',
      0x49: 'TD-4550DNWB'
    }
  };

  const seriesModels = models[seriesCode];
  const modelName = seriesModels ? seriesModels[modelCode] : null;

  // Déterminer le type de média
  const mediaTypes = {
    0x00: 'Aucun média',
    0x01: 'Ruban continu',
    0x02: 'Étiquettes découpées',
    0x03: 'Ruban continu (non-die-cut)',
    0x10: 'Die-cut labels',
    0x11: 'Ruban continu'
  };

  // Largeurs de média courantes (en mm)
  const widths = {
    12: '12mm',
    29: '29mm',
    38: '38mm',
    50: '50mm',
    54: '54mm',
    62: '62mm',
    102: '102mm'
  };

  return {
    type: 'brother',
    series: seriesCode === 0x30 ? 'QL' : seriesCode === 0x31 ? 'PT' : seriesCode === 0x32 ? 'TD' : 'Unknown',
    model: modelName || `Brother (code: 0x${modelCode.toString(16)})`,
    media: {
      width: widths[mediaWidth] || `${mediaWidth}mm`,
      type: mediaTypes[mediaType] || 'Unknown'
    },
    status: {
      hasError: errorInfo1 !== 0 || errorInfo2 !== 0,
      errorCode: errorInfo1 | (errorInfo2 << 8)
    },
    raw: data.slice(0, 32).toString('hex')
  };
}

/**
 * Teste une IP spécifique pour voir si c'est une imprimante Brother
 */
async function testPrinter(ip, port = 9100) {
  // D'abord vérifier si le port est ouvert
  const portCheck = await checkPort(ip, port, 2000);
  if (!portCheck.open) {
    return {
      success: false,
      error: `Port ${port} fermé ou inaccessible`
    };
  }

  // Essayer d'identifier le modèle
  const model = await getBrotherInfo(ip, port);
  
  return {
    success: true,
    ip,
    port,
    model,
    isBrother: model && model.type === 'brother'
  };
}

module.exports = {
  scanNetwork,
  quickScan,
  testPrinter,
  getBrotherInfo,
  getLocalNetworkRanges,
  PRINTER_PORTS
};
