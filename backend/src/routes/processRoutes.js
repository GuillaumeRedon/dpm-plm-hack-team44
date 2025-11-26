const express = require('express');
const router = express.Router();
const processService = require('../services/processService');

// Get all processes from all systems
router.get('/processes', async (req, res) => {
  try {
    const data = await processService.getAllProcesses();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analysis results (bottlenecks, inefficiencies, improvements)
router.get('/analysis', async (req, res) => {
  try {
    const analysis = await processService.getAnalysis();
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get process flow data for visualization
router.get('/flow', async (req, res) => {
  try {
    const flowData = await processService.getFlowData();
    res.json(flowData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
