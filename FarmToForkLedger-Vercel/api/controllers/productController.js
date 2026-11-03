const products = require('../data/sampleProducts');

/* ── helpers ── */
const audit = (p, actor, action, note) => {
  p.auditLog = p.auditLog || [];
  p.auditLog.unshift({ id: Date.now().toString(), actor, action, note, timestamp: new Date().toISOString() });
};
const clean = p => ({ ...p, status: p.status || 'in-transit', auditLog: p.auditLog || [] });
const role  = req => (req.headers['x-user-role'] || '').toLowerCase();
const staffOnly  = req => role(req) && role(req) !== 'consumer';
const exactRole  = (req, expected) => role(req) === expected;

/* ── data-mismatch validation ── */
const ANIMAL_KEYWORDS = [
  'egg','eggs','chicken','hen','meat','beef','pork','fish','salmon','tuna','prawn',
  'shrimp','milk','dairy','lamb','turkey','mutton','goat','duck','quail','bacon',
  'sausage','ham','lard','cream','butter','ghee','whey','gelatin',
];
const PLANT_KEYWORDS = [
  'apple','fuji','gala','granny','tomato','heirloom','vegetable','fruit','wheat',
  'corn','maize','rice','potato','carrot','berry','strawberry','blueberry','lemon',
  'mango','grape','onion','spinach','kale','lettuce','cabbage','broccoli','cauliflower',
  'pea','bean','lentil','pulse','dal','jowar','bajra','ragi','sugarcane','turmeric',
  'ginger','garlic','pepper','chilli','coriander','mint','basil','parsley',
];

// Price margin thresholds (warnings, not hard blocks)
const MARGIN_LOW_RATIO  = 1.05; // retail must be at least 5% above farmer price
const MARGIN_HIGH_RATIO = 10;   // retail should not be more than 10x farmer price

function validateProduct(b) {
  const warnings = [];
  const fp = Number(b.farmerPrice) || 0;
  const rp = Number(b.retailPrice) || 0;
  const name = (b.name || '').toLowerCase();
  const cat  = (b.category || '').toLowerCase();

  if (fp <= 0)          warnings.push('Farmer price must be greater than zero.');
  if (rp <= 0)          warnings.push('Retail price must be greater than zero.');
  if (fp > 0 && rp > 0) {
    if (fp >= rp)
      warnings.push('Farmer price cannot be equal to or greater than the retail price — please verify pricing data.');
    else if (rp / fp < MARGIN_LOW_RATIO)
      warnings.push(`Retail price (₹${rp}) is only ${((rp/fp - 1)*100).toFixed(0)}% above farmer price (₹${fp}). Please verify that supply-chain margins are correctly accounted for.`);
    else if (rp / fp > MARGIN_HIGH_RATIO)
      warnings.push(`Retail price (₹${rp}) is more than ${MARGIN_HIGH_RATIO}× the farmer price (₹${fp}). This appears unusually high — please verify the pricing data.`);
  }
  if (!b.farm || b.farm.trim().length < 2)
    warnings.push('Farm name appears too short or missing — please check the entry.');
  if (!b.location || b.location.trim().length < 2)
    warnings.push('Location appears too short or missing — please verify.');
  if (!b.name || b.name.trim().length < 2)
    warnings.push('Product name appears too short or missing — please check the entry.');

  // Category vs name mismatch
  const looksAnimal = ANIMAL_KEYWORDS.some(k => name.includes(k));
  const looksPlant  = PLANT_KEYWORDS.some(k  => name.includes(k));
  if (looksAnimal && cat === 'plant')
    warnings.push(`⚠️ Product name "${b.name}" suggests an animal product but category is set to Plant-based — possible data mismatch. Please correct the category.`);
  if (looksPlant && cat === 'animal')
    warnings.push(`⚠️ Product name "${b.name}" suggests a plant-based product but category is set to Animal product — possible data mismatch. Please correct the category.`);

  // Harvest date checks
  if (b.harvestDate) {
    const hd = new Date(b.harvestDate);
    if (!isNaN(hd.getTime())) {
      if (hd > new Date())
        warnings.push('Harvest date is set in the future — please verify the date is correct.');
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      if (hd < ninetyDaysAgo)
        warnings.push('Harvest date is more than 90 days in the past — please verify this is the correct harvest date and not a transcription error.');
    }
  }

  return warnings;
}

/* ── search indexing ── */
function buildIndex(p) {
  // Build a rich, weighted token set from all available fields
  const tokens = [];
  const add = (val, weight) => {
    if (val == null || val === '') return;
    String(val).toLowerCase()
      .split(/[\s,\-\/\.₹:]+/)
      .forEach(t => { if (t.length > 1) tokens.push({ t, weight }); });
  };

  // Core identity fields — highest weight
  add(p.name,       10);
  add(p.batchId,    10);
  add(p.qrCode,     10);

  // Farm + origin — high weight
  add(p.farm,        8);
  add(p.location,    8);

  // Certifications — high weight (consumers search for "organic", "non-gmo")
  (p.certifications || []).forEach(c => add(c, 7));

  // Category — both raw value and display name
  add(p.category,    6);
  if (p.category === 'plant')  { add('plant-based', 6); add('vegetable', 5); add('fruit', 5); }
  if (p.category === 'animal') { add('animal product', 6); add('livestock', 5); }

  // Status — medium weight (search "approved", "draft", "transit")
  add(p.status,      5);
  if (p.status) add(p.status.replace(/-/g, ' '), 5);

  // Next verifier
  add(p.nextVerifier, 4);

  // Harvest date — as searchable text
  add(p.harvestDate,  4);

  // Prices — tokenized so "100" or "250" searches work
  if (p.farmerPrice != null) { add(String(p.farmerPrice), 4); add('₹' + p.farmerPrice, 3); }
  if (p.retailPrice  != null) { add(String(p.retailPrice),  4); add('₹' + p.retailPrice,  3); }
  if (p.aggregatorMargin != null) add(String(p.aggregatorMargin), 2);
  if (p.retailerMargin   != null) add(String(p.retailerMargin),   2);

  // Emoji — low weight
  add(p.emoji, 3);

  // Verifications — actor names and notes
  (p.verifications || []).forEach(v => {
    add(v.actor, 5);
    add(v.note,  3);
  });

  // Audit log — actions, actors, notes
  (p.auditLog || []).forEach(a => {
    add(a.action, 4);
    add(a.actor,  4);
    add(a.note,   2);
  });

  // Blockchain hash — low weight but searchable
  add(p.blockchainHash, 2);

  // Data warnings text — so users can search "mismatch" or "warning"
  (p.dataWarnings || []).forEach(w => add(w, 1));

  return tokens;
}

function scoreProduct(p, queryTerms) {
  const tokens = buildIndex(p);
  let score = 0;
  queryTerms.forEach(q => {
    tokens.forEach(({ t, weight }) => {
      if (t === q)               score += weight * 2;              // exact token match
      else if (t.startsWith(q)) score += weight;                  // prefix match
      else if (t.includes(q))   score += Math.floor(weight / 2); // substring match
    });
  });
  return score;
}

/* ── CRUD ── */
exports.getAllProducts = (req, res) => res.json(products.map(clean));

exports.getProductByQRCode = (req, res) => {
  const p = products.find(x => x.qrCode === req.params.qrCode);
  p ? res.json(clean(p)) : res.status(404).json({ message: 'No ledger batch found.' });
};

exports.searchProducts = (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.json(products.map(clean));

  const queryTerms = q.split(/\s+/).filter(t => t.length > 0);
  const scored = products
    .map(p => ({ product: clean(p), score: scoreProduct(p, queryTerms) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  res.json(scored.map(x => x.product));
};

exports.validateProductData = (req, res) => {
  const warnings = validateProduct(req.body);
  res.json({ warnings });
};

exports.addProduct = (req, res) => {
  if (!staffOnly(req)) return res.status(403).json({ message: 'Consumer accounts cannot create or change ledger records.' });
  const b = req.body;
  if (!b.name || !b.farm || !b.location) return res.status(400).json({ message: 'Name, farm and location are required.' });

  const dataWarnings = validateProduct(b);

  const id = Date.now().toString();
  const p = {
    id,
    name: b.name,
    emoji: b.emoji || '🌾',
    category: b.category || 'plant',
    farm: b.farm,
    location: b.location,
    harvestDate: b.harvestDate || new Date().toLocaleDateString(),
    batchId: 'FTF-HARV-' + id.slice(-6),
    qrCode: 'FTF-' + id,
    farmerPrice: Number(b.farmerPrice) || 0,
    aggregatorMargin: Number(b.aggregatorMargin) || 0,
    retailerMargin: Number(b.retailerMargin) || 0,
    retailPrice: Number(b.retailPrice) || 0,
    certifications: b.certifications ? b.certifications.split(',').map(x => x.trim()) : ['Farmer-declared'],
    blockchainHash: '0x' + id.slice(-8),
    productImage: b.productImage || null,   // farmer-uploaded product photo
    verifications: [],
    nextVerifier: 'farmer',
    status: 'draft',
    auditLog: [],
    dataWarnings,
  };
  audit(p, role(req), 'Draft created', 'Harvest record created and awaiting farmer submission.');
  products.unshift(p);

  if (dataWarnings.length > 0) {
    return res.status(201).json({
      ...p,
      message: `⚠️ Draft created — but ${dataWarnings.length} data warning(s) were detected in your submission. Please review and correct the flagged fields before submitting to USDA.`,
      dataWarnings,
    });
  }
  res.status(201).json({ ...p, message: 'Draft harvest record created successfully.' });
};

exports.updateProduct = (req, res) => {
  if (!staffOnly(req)) return res.status(403).json({ message: 'Consumer accounts cannot modify ledger records.' });
  const p = products.find(x => x.qrCode === req.params.qrCode);
  if (!p) return res.status(404).json({ message: 'Batch not found.' });
  if (p.status !== 'draft') return res.status(409).json({ message: 'Only draft harvest records can be modified.' });
  const b = req.body;
  if (!b.name || !b.farm || !b.location) return res.status(400).json({ message: 'Name, farm and location are required.' });

  const dataWarnings = validateProduct(b);

  p.name = b.name;
  p.farm = b.farm;
  p.location = b.location;
  p.category = b.category || p.category;
  p.farmerPrice = Number(b.farmerPrice) || 0;
  p.retailPrice = Number(b.retailPrice) || 0;
  p.dataWarnings = dataWarnings;
  if (b.productImage) p.productImage = b.productImage; // update image if a new one was uploaded
  audit(p, role(req), 'Draft modified', 'Harvest details were updated before submission.');

  if (dataWarnings.length > 0) {
    return res.json({
      message: `⚠️ Record modified — but ${dataWarnings.length} data warning(s) were detected. Please review and correct the flagged fields before submitting to USDA.`,
      product: p,
      dataWarnings,
    });
  }
  res.json({ message: 'Draft harvest record modified successfully.', product: p, dataWarnings: [] });
};

exports.deleteProduct = (req, res) => {
  if (!staffOnly(req)) return res.status(403).json({ message: 'Consumer accounts cannot delete ledger records.' });
  const i = products.findIndex(x => x.qrCode === req.params.qrCode);
  if (i < 0) return res.status(404).json({ message: 'Batch not found.' });
  const p = products[i];
  if (p.status !== 'draft') return res.status(409).json({ message: 'Only unsubmitted draft harvest records can be deleted.' });
  products.splice(i, 1);
  res.json({ message: 'Draft harvest record deleted.' });
};

exports.submitToUsda = (req, res) => {
  if (!exactRole(req, 'farmer')) return res.status(403).json({ message: 'Only the farmer demo account can submit a harvest to USDA review.' });
  const p = products.find(x => x.qrCode === req.params.qrCode);
  if (!p) return res.status(404).json({ message: 'Batch not found.' });
  if (p.status !== 'draft') return res.status(409).json({ message: 'Only draft records can be submitted to USDA.' });

  // Re-validate before USDA submission — alert farmer of any issues
  const dataWarnings = validateProduct(p);
  if (dataWarnings.length > 0) {
    p.dataWarnings = dataWarnings;
  }

  p.status = 'awaiting-usda';
  p.nextVerifier = 'usda';
  p.verifications.push({ actor: 'Farmer producer', note: 'Harvest details submitted for USDA review.', timestamp: new Date().toISOString() });
  audit(p, 'Farmer', 'Submitted to USDA', 'Harvest record, standards and pricing information sent for simulated USDA testing.');

  if (dataWarnings.length > 0) {
    return res.json({
      ...p,
      message: `⚠️ Submitted to USDA — but ${dataWarnings.length} data warning(s) were detected. USDA may request corrections. Please review the warnings below.`,
      dataWarnings,
    });
  }
  res.json({ ...p, message: 'Successfully submitted to USDA review.' });
};

exports.usdaReview = (req, res) => {
  if (!exactRole(req, 'usda')) return res.status(403).json({ message: 'Only the USDA reviewer demo account can perform this review.' });
  const p = products.find(x => x.qrCode === req.params.qrCode);
  const { approved, note } = req.body;
  if (!p) return res.status(404).json({ message: 'Batch not found.' });
  if (p.nextVerifier !== 'usda') return res.status(409).json({ message: 'This batch is not awaiting USDA review.' });

  // USDA data-consistency check
  const usdaWarnings = validateProduct(p);
  if (usdaWarnings.length > 0 && approved) {
    // flag warnings even on approve
    p.dataWarnings = usdaWarnings;
  }

  if (approved) {
    p.status = 'usda-approved';
    p.nextVerifier = 'aggregator';
    p.verifications.push({ actor: 'USDA Food Safety Desk (demo)', note: note || 'Demo USDA review passed: harvest data, declared standards and lot identifiers matched.', timestamp: new Date().toISOString() });
    audit(p, 'USDA Food Safety Desk (demo)', 'Approved', 'Independent second-step review completed. Released to aggregator.');
  } else {
    p.status = 'usda-correction-required';
    p.nextVerifier = 'farmer';
    audit(p, 'USDA Food Safety Desk (demo)', 'Correction requested', note || 'Information mismatch found. Farmer must amend and resubmit.');
  }
  res.json({ ...p, dataWarnings: usdaWarnings });
};

const next = { aggregator: 'retailer', retailer: null };
exports.verifyProduct = (req, res) => {
  const p = products.find(x => x.qrCode === req.params.qrCode);
  const r = req.body.role;
  if (!exactRole(req, r)) return res.status(403).json({ message: 'Role verification failed.' });
  if (!p) return res.status(404).json({ message: 'No ledger batch found.' });
  if (!next.hasOwnProperty(r)) return res.status(400).json({ message: 'This role cannot verify a chain handoff.' });
  if (p.nextVerifier !== r) return res.status(409).json({ message: p.nextVerifier ? 'This batch awaits ' + p.nextVerifier + ' verification.' : 'This product is fully verified.' });
  p.verifications.push({ actor: r[0].toUpperCase() + r.slice(1) + ' partner', note: 'Handoff values matched, reviewed and saved to the immutable audit trail.', timestamp: new Date().toISOString() });
  p.nextVerifier = next[r];
  p.status = next[r] ? 'in-transit' : 'fully-verified';
  audit(p, r[0].toUpperCase() + r.slice(1), 'Handoff verified', 'Values matched against the previous verified record.');
  res.json({ ...p, message: 'Handoff verified successfully.' });
};
