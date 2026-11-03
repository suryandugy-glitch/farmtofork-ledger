const express = require('express');
const r = express.Router();
const c = require('../controllers/productController');

r.get('/search', c.searchProducts);          // GET /api/products/search?q=<query>
r.post('/validate', c.validateProductData);  // POST /api/products/validate
r.get('/', c.getAllProducts);
r.get('/:qrCode', c.getProductByQRCode);
r.post('/', c.addProduct);
r.put('/:qrCode', c.updateProduct);
r.delete('/:qrCode', c.deleteProduct);
r.post('/:qrCode/submit-usda', c.submitToUsda);
r.post('/:qrCode/usda-review', c.usdaReview);
r.post('/:qrCode/verify', c.verifyProduct);

module.exports = r;
