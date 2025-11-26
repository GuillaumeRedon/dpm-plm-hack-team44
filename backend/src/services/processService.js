const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR = path.join(__dirname, '../../../data');

// Parse an Excel file and return data as an array of objects
function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

// Convert time string (HH:MM:SS) to minutes
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const str = String(timeStr);
  const parts = str.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
  }
  return 0;
}

// Load all Excel files from data directory
async function getAllProcesses() {
  const allData = {};
  
  const files = {
    'ERP': 'ERP_Equipes Airplus.xlsx',
    'MES': 'MES_Extraction.xlsx',
    'PLM': 'PLM_DataSet.xlsx'
  };

  for (const [systemName, fileName] of Object.entries(files)) {
    const filePath = path.join(DATA_DIR, fileName);
    if (fs.existsSync(filePath)) {
      allData[systemName] = parseExcel(filePath);
    }
  }

  return allData;
}

// Analyze processes for bottlenecks, inefficiencies, and improvements
async function getAnalysis() {
  const allData = await getAllProcesses();
  const analysis = {
    bottlenecks: [],
    inefficiencies: [],
    improvements: [],
    statistics: {}
  };

  // Analyze ERP data (Employee/Team data)
  if (allData.ERP) {
    const erp = allData.ERP;
    const costs = erp.map(r => parseFloat(r['Coût horaire (€)']) || 0);
    const ages = erp.map(r => parseInt(r['Âge']) || 0);
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;

    analysis.statistics.ERP = {
      totalEmployees: erp.length,
      avgHourlyCost: avgCost.toFixed(2),
      avgAge: avgAge.toFixed(1),
      experienceLevels: {}
    };

    // Count experience levels
    erp.forEach(emp => {
      const level = emp["Niveau d'expérience"] || 'Unknown';
      analysis.statistics.ERP.experienceLevels[level] = 
        (analysis.statistics.ERP.experienceLevels[level] || 0) + 1;
    });

    // Identify high-cost employees as potential optimization targets
    erp.forEach(emp => {
      const cost = parseFloat(emp['Coût horaire (€)']) || 0;
      if (cost > avgCost * 1.3) {
        analysis.inefficiencies.push({
          system: 'ERP',
          type: 'High Labor Cost',
          detail: `${emp['Prénom']} ${emp['Nom']} (${emp['Qualification']})`,
          value: `€${cost.toFixed(2)}/h vs avg €${avgCost.toFixed(2)}/h`,
          reason: 'Hourly cost exceeds average by 30%+'
        });
      }
    });

    // Check for skill gaps
    const juniorCount = erp.filter(e => e["Niveau d'expérience"] === 'Débutant').length;
    if (juniorCount > erp.length * 0.3) {
      analysis.improvements.push({
        system: 'ERP',
        suggestion: 'Implement mentorship program',
        reason: `${((juniorCount/erp.length)*100).toFixed(0)}% of workforce are beginners`
      });
    }
  }

  // Analyze MES data (Manufacturing Execution)
  if (allData.MES) {
    const mes = allData.MES;
    
    // Calculate time delays
    const timeDelays = mes.map(r => {
      const planned = timeToMinutes(r['Temps Prévu']);
      const actual = timeToMinutes(r['Temps Réel']);
      return { ...r, planned, actual, delay: actual - planned };
    });

    const totalDelay = timeDelays.reduce((sum, r) => sum + Math.max(0, r.delay), 0);
    const avgDelay = totalDelay / mes.length;

    analysis.statistics.MES = {
      totalOperations: mes.length,
      totalDelayMinutes: totalDelay.toFixed(1),
      avgDelayMinutes: avgDelay.toFixed(1),
      issuesByType: {}
    };

    // Count issues by type
    mes.forEach(op => {
      const issue = op['Aléas Industriels'] || 'None';
      analysis.statistics.MES.issuesByType[issue] = 
        (analysis.statistics.MES.issuesByType[issue] || 0) + 1;
    });

    // Identify bottlenecks (operations with significant delays)
    timeDelays.forEach(op => {
      if (op.delay > 10) { // More than 10 minutes delay
        analysis.bottlenecks.push({
          system: 'MES',
          activity: op['Nom'],
          workstation: `Poste ${op['Poste']}`,
          plannedTime: op['Temps Prévu'],
          actualTime: op['Temps Réel'],
          delay: `+${op.delay.toFixed(1)} min`,
          issue: op['Aléas Industriels'] || 'Unknown',
          cause: op['Cause Potentielle'] || 'Not specified'
        });
      }
    });

    // Find recurring issues
    const issueCounts = {};
    mes.forEach(op => {
      const issue = op['Aléas Industriels'];
      if (issue) {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      }
    });

    for (const [issue, count] of Object.entries(issueCounts)) {
      if (count >= 3) {
        analysis.improvements.push({
          system: 'MES',
          suggestion: `Address recurring issue: ${issue}`,
          reason: `Occurred ${count} times - consider preventive measures`
        });
      }
    }
  }

  // Analyze PLM data (Product Lifecycle)
  if (allData.PLM) {
    const plm = allData.PLM;
    const costs = plm.map(r => parseFloat(r['Coût achat pièce (€)']) || 0);
    const totalCost = costs.reduce((a, b) => a + b, 0);
    const avgCost = totalCost / plm.length;

    analysis.statistics.PLM = {
      totalParts: plm.length,
      totalPartsCost: `€${totalCost.toLocaleString()}`,
      avgPartCost: `€${avgCost.toFixed(2)}`,
      criticalParts: plm.filter(p => p['Criticité'] === 'Critique').length,
      supplierCount: [...new Set(plm.map(p => p['Fournisseur']))].length
    };

    // Identify critical parts with long lead times
    plm.forEach(part => {
      if (part['Criticité'] === 'Critique') {
        const leadTime = part['Délai Approvisionnement'];
        if (leadTime && leadTime.includes('20') || leadTime && leadTime.includes('25')) {
          analysis.bottlenecks.push({
            system: 'PLM',
            activity: 'Supply Chain',
            part: part['Désignation'],
            reference: part['Code / Référence'],
            leadTime: leadTime,
            criticality: part['Criticité'],
            supplier: part['Fournisseur'],
            reason: 'Critical part with long lead time'
          });
        }
      }
    });

    // Check for expensive parts
    plm.forEach(part => {
      const cost = parseFloat(part['Coût achat pièce (€)']) || 0;
      if (cost > 50000) {
        analysis.inefficiencies.push({
          system: 'PLM',
          type: 'High Part Cost',
          detail: `${part['Désignation']} (${part['Code / Référence']})`,
          value: `€${cost.toLocaleString()}`,
          reason: 'Consider alternative suppliers or design optimization'
        });
      }
    });

    // Supplier concentration risk
    const supplierParts = {};
    plm.forEach(part => {
      const supplier = part['Fournisseur'];
      supplierParts[supplier] = (supplierParts[supplier] || 0) + 1;
    });

    for (const [supplier, count] of Object.entries(supplierParts)) {
      if (count > plm.length * 0.25) {
        analysis.improvements.push({
          system: 'PLM',
          suggestion: `Diversify supplier base for ${supplier}`,
          reason: `${count} parts (${((count/plm.length)*100).toFixed(0)}%) from single supplier`
        });
      }
    }
  }

  return analysis;
}

// Generate flow data for ReactFlow visualization
async function getFlowData() {
  const allData = await getAllProcesses();
  const nodes = [];
  const edges = [];

  // Create a process flow visualization showing the relationship between systems
  // Central node for the aircraft assembly process
  nodes.push({
    id: 'main',
    type: 'input',
    data: { label: '✈️ Aircraft Assembly Process' },
    position: { x: 400, y: 0 }
  });

  let systemY = 120;

  // ERP System node
  if (allData.ERP) {
    nodes.push({
      id: 'erp',
      data: { 
        label: '👥 ERP - Workforce',
        details: `${allData.ERP.length} Employees`
      },
      position: { x: 100, y: systemY }
    });
    edges.push({ id: 'main-erp', source: 'main', target: 'erp' });

    // Add experience level distribution
    const levels = {};
    allData.ERP.forEach(e => {
      const level = e["Niveau d'expérience"] || 'Unknown';
      levels[level] = (levels[level] || 0) + 1;
    });

    let levelY = systemY + 100;
    Object.entries(levels).forEach(([level, count], idx) => {
      const nodeId = `erp-${level}`;
      nodes.push({
        id: nodeId,
        data: { label: `${level}: ${count}` },
        position: { x: 50 + idx * 120, y: levelY }
      });
      edges.push({ id: `erp-${nodeId}`, source: 'erp', target: nodeId });
    });
  }

  // MES System node
  if (allData.MES) {
    nodes.push({
      id: 'mes',
      data: { 
        label: '🏭 MES - Manufacturing',
        details: `${allData.MES.length} Operations`
      },
      position: { x: 400, y: systemY }
    });
    edges.push({ id: 'main-mes', source: 'main', target: 'mes' });

    // Add workstations
    const workstations = [...new Set(allData.MES.map(m => m['Poste']))].slice(0, 6);
    let wsY = systemY + 100;
    workstations.forEach((ws, idx) => {
      const opsAtWs = allData.MES.filter(m => m['Poste'] === ws);
      const nodeId = `mes-ws-${ws}`;
      nodes.push({
        id: nodeId,
        data: { 
          label: `Poste ${ws}`,
          count: opsAtWs.length
        },
        position: { x: 300 + idx * 80, y: wsY }
      });
      edges.push({ 
        id: `mes-${nodeId}`, 
        source: 'mes', 
        target: nodeId,
        animated: opsAtWs.some(op => op['Aléas Industriels'])
      });
    });
  }

  // PLM System node
  if (allData.PLM) {
    nodes.push({
      id: 'plm',
      data: { 
        label: '📦 PLM - Parts',
        details: `${allData.PLM.length} Components`
      },
      position: { x: 700, y: systemY }
    });
    edges.push({ id: 'main-plm', source: 'main', target: 'plm' });

    // Add criticality distribution
    const criticalities = {};
    allData.PLM.forEach(p => {
      const crit = p['Criticité'] || 'Unknown';
      criticalities[crit] = (criticalities[crit] || 0) + 1;
    });

    let critY = systemY + 100;
    Object.entries(criticalities).forEach(([crit, count], idx) => {
      const nodeId = `plm-${crit}`;
      nodes.push({
        id: nodeId,
        data: { label: `${crit}: ${count}` },
        position: { x: 650 + idx * 100, y: critY }
      });
      edges.push({ 
        id: `plm-${nodeId}`, 
        source: 'plm', 
        target: nodeId,
        animated: crit === 'Critique'
      });
    });
  }

  // Add connections between systems (showing integration)
  if (allData.ERP && allData.MES) {
    edges.push({ 
      id: 'erp-mes', 
      source: 'erp', 
      target: 'mes', 
      style: { strokeDasharray: '5 5' },
      label: 'Workforce allocation'
    });
  }

  if (allData.MES && allData.PLM) {
    edges.push({ 
      id: 'plm-mes', 
      source: 'plm', 
      target: 'mes', 
      style: { strokeDasharray: '5 5' },
      label: 'Parts supply'
    });
  }

  return { nodes, edges };
}

module.exports = {
  getAllProcesses,
  getAnalysis,
  getFlowData
};
