const db = require('../../../database/db');

exports.getProducts = (req, res, next) => {
  try {
    const { category, search } = req.query;
    const products = db.getProducts(category || 'all', search || '');
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = (req, res, next) => {
  try {
    const { title, category, price, desc, img, condition, seller } = req.body;
    if (!title || !price) {
      return res.status(400).json({ success: false, message: 'Title and price are required' });
    }

    const newProduct = db.createProduct({
      title,
      category,
      price,
      desc,
      img,
      condition,
      seller
    });

    res.status(201).json({ success: true, message: 'Item listed successfully', data: newProduct });
  } catch (error) {
    next(error);
  }
};
