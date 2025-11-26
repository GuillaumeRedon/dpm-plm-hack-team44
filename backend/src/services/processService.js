const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const DATA_DIR = path.join(__dirname, '../../data');

// Parse a CSV file and return data as an array
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Load all CSV files from data directory
async function getAllProcesses() {
  const files = ['system1.csv', 'system2.csv', 'system3.csv'];
  const allData = {};

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      const systemName = file.replace('.csv', '');
      allData[systemName] = await parseCSV(filePath);
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

  for (const [system, records] of Object.entries(allData)) {
    // Calculate statistics
    const durations = records.map(r => parseFloat(r.duration) || 0);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const maxDuration = Math.max(...durations, 0);
    const minDuration = Math.min(...durations, Infinity);

    analysis.statistics[system] = {
      totalRecords: records.length,
      avgDuration: avgDuration.toFixed(2),
      maxDuration: maxDuration.toFixed(2),
      minDuration: minDuration === Infinity ? 0 : minDuration.toFixed(2)
    };

    // Identify bottlenecks (activities with duration > 2x average)
    records.forEach(record => {
      const duration = parseFloat(record.duration) || 0;
      if (duration > avgDuration * 2) {
        analysis.bottlenecks.push({
          system,
          activity: record.activity,
          caseId: record.case_id,
          duration: duration.toFixed(2),
          reason: 'Duration exceeds 2x average'
        });
      }
    });

    // Identify inefficiencies (repeated activities in same case)
    const caseActivities = {};
    records.forEach(record => {
      const key = `${record.case_id}-${record.activity}`;
      caseActivities[key] = (caseActivities[key] || 0) + 1;
    });

    for (const [key, count] of Object.entries(caseActivities)) {
      if (count > 1) {
        const [caseId, activity] = key.split('-');
        analysis.inefficiencies.push({
          system,
          caseId,
          activity,
          occurrences: count,
          reason: 'Activity repeated multiple times'
        });
      }
    }

    // Suggest improvements based on patterns
    if (avgDuration > 10) {
      analysis.improvements.push({
        system,
        suggestion: 'Consider process automation',
        reason: `High average duration (${avgDuration.toFixed(2)} units)`
      });
    }

    if (analysis.bottlenecks.filter(b => b.system === system).length > 3) {
      analysis.improvements.push({
        system,
        suggestion: 'Review resource allocation',
        reason: 'Multiple bottlenecks detected'
      });
    }
  }

  return analysis;
}

// Generate flow data for ReactFlow visualization
async function getFlowData() {
  const allData = await getAllProcesses();
  const nodes = [];
  const edges = [];

  let yOffset = 0;

  for (const [system, records] of Object.entries(allData)) {
    // Create system node
    const systemNodeId = `system-${system}`;
    nodes.push({
      id: systemNodeId,
      type: 'input',
      data: { label: system.toUpperCase() },
      position: { x: 50, y: yOffset }
    });

    // Get unique activities for this system
    const activities = [...new Set(records.map(r => r.activity))];
    
    let xOffset = 250;
    let prevNodeId = systemNodeId;

    activities.forEach((activity, index) => {
      const nodeId = `${system}-${activity}`;
      const activityRecords = records.filter(r => r.activity === activity);
      const avgDuration = activityRecords.reduce((sum, r) => sum + (parseFloat(r.duration) || 0), 0) / activityRecords.length;

      nodes.push({
        id: nodeId,
        data: { 
          label: activity,
          count: activityRecords.length,
          avgDuration: avgDuration.toFixed(2)
        },
        position: { x: xOffset, y: yOffset }
      });

      edges.push({
        id: `edge-${prevNodeId}-${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        animated: avgDuration > 10
      });

      prevNodeId = nodeId;
      xOffset += 200;
    });

    yOffset += 150;
  }

  return { nodes, edges };
}

module.exports = {
  getAllProcesses,
  getAnalysis,
  getFlowData
};
