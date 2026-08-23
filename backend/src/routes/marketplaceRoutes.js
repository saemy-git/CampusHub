const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

router.get('/', marketplaceController.getProducts);
router.post('/', marketplaceController.createProduct);

module.exports = router;
