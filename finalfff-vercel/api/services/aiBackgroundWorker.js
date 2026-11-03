/**
 * AI Background Audit Worker
 * Runs autonomously in the backend, continuously evaluating ledger items,
 * comparing pre-existing historical market baselines with newly entered harvest records,
 * checking prices set by farmers, and logging transparency metrics.
 */

const products = require('../data/sampleProducts');
const aiPricingModel = require('./aiPricingModel');

class AIBackgroundWorker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMs = 10000; // 10 seconds per automated audit pass
    this.lastRunTime = null;
    this.cyclesCompleted = 0;
    this.totalAuditedRecords = 0;
    this.anomaliesDetected = 0;
    this.avgFairnessScore = 100;
    this.auditLogs = [];
    this.maxLogs = 60;
  }

  start(intervalMs = 10000) {
    if (this.isRunning) return;
    this.intervalMs = intervalMs;
    this.isRunning = true;
    console.log(`[AI-BACKGROUND-WORKER] Started background AI Pricing Audit daemon (Cycle: ${this.intervalMs}ms)`);
    
    // Immediate first pass
    this.runAuditPass('Automatic startup verification');

    // Recurring daemon timer
    this.intervalId = setInterval(() => {
      this.runAuditPass('Scheduled background evaluation');
    }, this.intervalMs);
  }

  stop() {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    console.log('[AI-BACKGROUND-WORKER] Background audit daemon stopped');
  }

  runAuditPass(triggerReason = 'Background cycle') {
    this.lastRunTime = new Date().toISOString();
    this.cyclesCompleted += 1;

    let totalScore = 0;
    let anomalyCount = 0;
    let auditedThisPass = 0;

    // Scan all ledger products
    products.forEach(p => {
      const assessment = aiPricingModel.evaluateProductPricing(p);
      // Cache latest AI assessment directly onto product record
      p.aiAssessment = assessment;

      auditedThisPass += 1;
      this.totalAuditedRecords += 1;
      totalScore += assessment.pricingComparison.fairnessScore;

      const isAnomaly = assessment.pricingComparison.fairnessStatus !== 'fair';
      if (isAnomaly) {
        anomalyCount += 1;
        this.anomaliesDetected += 1;
      }

      // Record to audit stream
      this.addLog({
        id: 'AI-LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        triggerReason,
        batchId: p.batchId || p.qrCode || 'UNKNOWN-BATCH',
        productName: p.name,
        farmer: p.farm,
        originalFarmerPrice: p.farmerPrice,
        baselineFarmerPrice: assessment.historicalBaseline.avgFarmerPrice,
        retailPrice: p.retailPrice,
        fairnessScore: assessment.pricingComparison.fairnessScore,
        fairnessStatus: assessment.pricingComparison.fairnessStatus,
        deviationPct: assessment.pricingComparison.deviationPct,
        farmerSharePct: assessment.pricingComparison.actualFarmerSharePct,
        summary: assessment.farmerVerdict,
      });
    });

    if (auditedThisPass > 0) {
      this.avgFairnessScore = Math.round(totalScore / auditedThisPass);
    }
  }

  addLog(logEntry) {
    this.auditLogs.unshift(logEntry);
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs.pop();
    }
  }

  getStatus() {
    return {
      status: this.isRunning ? 'RUNNING' : 'STOPPED',
      mode: 'Continuous Background Daemon',
      intervalMs: this.intervalMs,
      lastRunTime: this.lastRunTime,
      cyclesCompleted: this.cyclesCompleted,
      totalAuditedRecords: this.totalAuditedRecords,
      currentActiveBatches: products.length,
      anomaliesDetected: this.anomaliesDetected,
      avgFairnessScore: this.avgFairnessScore,
      recentLogs: this.auditLogs.slice(0, 25),
    };
  }

  triggerManualAudit() {
    this.runAuditPass('User manual trigger');
    return this.getStatus();
  }

  getHistoricalComparison() {
    const baselines = aiPricingModel.getAllBaselines();
    
    // Build aggregate comparison between Old Baseline Data and New Ledger Batches
    const comparison = baselines.map(base => {
      // Find matching ledger batches
      const matches = products.filter(p => {
        const pName = (p.name || '').toLowerCase();
        return base.keywords && base.keywords.some(k => pName.includes(k));
      });

      const activeFarmerPrices = matches.map(m => Number(m.farmerPrice) || 0);
      const activeAvgFarmerPrice = activeFarmerPrices.length > 0
        ? Math.round(activeFarmerPrices.reduce((a, b) => a + b, 0) / activeFarmerPrices.length)
        : null;

      const activeRetailPrices = matches.map(m => Number(m.retailPrice) || 0);
      const activeAvgRetailPrice = activeRetailPrices.length > 0
        ? Math.round(activeRetailPrices.reduce((a, b) => a + b, 0) / activeRetailPrices.length)
        : null;

      const activeAvgFarmerShare = (activeAvgFarmerPrice && activeAvgRetailPrice)
        ? Number(((activeAvgFarmerPrice / activeAvgRetailPrice) * 100).toFixed(1))
        : null;

      const priceDifference = activeAvgFarmerPrice != null
        ? activeAvgFarmerPrice - base.historicalFarmerPrice.avg
        : 0;

      return {
        id: base.id,
        commodity: base.name,
        category: base.category,
        region: base.region,
        unit: base.unit,
        // Old Data (Historical Benchmarks)
        historical: {
          observationsCount: base.historicalObservationsCount,
          farmerPriceMin: base.historicalFarmerPrice.min,
          farmerPriceMax: base.historicalFarmerPrice.max,
          farmerPriceAvg: base.historicalFarmerPrice.avg,
          retailPriceAvg: base.historicalRetailPrice.avg,
          farmerSharePct: base.typicalFarmerSharePct,
          typicalAggregatorMargin: base.typicalAggregatorMargin,
          typicalRetailerMargin: base.typicalRetailerMargin,
        },
        // New Data (Current Active Ledger Batches)
        currentLedger: {
          matchingBatchesCount: matches.length,
          batchIds: matches.map(m => m.batchId || m.qrCode),
          activeFarmerPriceAvg: activeAvgFarmerPrice,
          activeRetailPriceAvg: activeAvgRetailPrice,
          activeFarmerSharePct: activeAvgFarmerShare,
        },
        // Comparison insights
        variance: {
          farmerPriceDiff: priceDifference,
          variancePct: base.historicalFarmerPrice.avg > 0
            ? Number(((priceDifference / base.historicalFarmerPrice.avg) * 100).toFixed(1))
            : 0,
          status: Math.abs(priceDifference) <= 15 ? 'ALIGNED_FAIR' : priceDifference < -15 ? 'UNDERPRICED' : 'ABOVE_AVERAGE',
        },
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      historicalBaselinesCount: baselines.length,
      currentBatchesEvaluated: products.length,
      commodities: comparison,
    };
  }
}

const singleton = new AIBackgroundWorker();
module.exports = singleton;
