const express = require('express');
const router = express.Router();
const aiWorker = require('../services/aiBackgroundWorker');
const aiPricingModel = require('../services/aiPricingModel');

// GET /api/ai/status - Background worker heartbeat, counters, and recent logs
router.get('/status', (req, res) => {
  res.json(aiWorker.getStatus());
});

// POST /api/ai/evaluate - Real-time AI pricing evaluation for farmer form inputs
router.post('/evaluate', (req, res) => {
  const productData = req.body || {};
  const assessment = aiPricingModel.evaluateProductPricing(productData);
  res.json(assessment);
});

// POST /api/ai/trigger-run - Manually trigger an immediate background audit pass
router.post('/trigger-run', (req, res) => {
  const updatedStatus = aiWorker.triggerManualAudit();
  res.json({
    message: 'Manual background AI audit pass completed successfully.',
    status: updatedStatus,
  });
});

// GET /api/ai/historical-comparison - Aggregated comparison: Old Historical Data vs Current Ledger Data
router.get('/historical-comparison', (req, res) => {
  const comparison = aiWorker.getHistoricalComparison();
  res.json(comparison);
});

// GET /api/ai/historical-baselines - Raw historical baseline datasets
router.get('/historical-baselines', (req, res) => {
  res.json(aiPricingModel.getAllBaselines());
});

module.exports = router;
