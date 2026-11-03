require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();

// ── Memory storage for file uploads (Serverless and Vercel compatible) ──
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

// ── Standard Middleware ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Upload handler (returns base64 Data URL) ──
const handleImageUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file received.' });
  }

  const base64Data = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype || 'image/jpeg';
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  res.json({
    message: 'Image uploaded successfully.',
    imageUrl,
    filename: req.file.originalname,
    size: req.file.size,
  });
};

// Mount upload endpoint on both /api/upload and /upload for flexibility
app.post('/api/upload', upload.single('image'), handleImageUpload);
app.post('/upload', upload.single('image'), handleImageUpload);

// ── Multer error handling ──
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5 MB.' });
  }
  if (err.message) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// ── API Routes for Products ──
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);
app.use('/products', productRoutes);

// ── API Routes for AI Engine ──
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);
app.use('/ai', aiRoutes);

// ── Background AI Worker Daemon ──
const aiWorker = require('./services/aiBackgroundWorker');
aiWorker.start(10000);

// ── Health check endpoint ──
const handleHealth = (req, res) => {
  res.json({
    message: 'FarmToFork Ledger API is running smoothly on Vercel!',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// ── Start server only when run directly (local testing) ──
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`FarmToFork API running locally on port ${PORT}`);
  });
}

module.exports = app;
