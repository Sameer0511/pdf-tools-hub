const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Access & Permission Error Fix: Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Render Debug Logs
console.log("Current Directory:", __dirname);
try {
    console.log("Files available:", fs.readdirSync(__dirname));
} catch (e) {
    console.log("Error reading directory:", e.message);
}

// 2. Case-sensitivity & Query String Fix Middleware
app.use((req, res, next) => {
    if (req.path === '/style.css' || req.path === '/style.CSS') {
        const filePath = path.join(__dirname, 'style.CSS');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    if (req.path === '/script.js') {
        const filePath = path.join(__dirname, 'script.js');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    next();
});

// Serve static files
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'Smart-Tool-Website')));

const upload = multer({ dest: 'uploads/' });

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.HTML'), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'index.html'), (err2) => {
                if (err2) {
                    res.status(404).send('index.html not found! Check logs.');
                }
            });
        }
    });
});

// API Route for backend PDF processing
app.post('/api/process-pdf', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({ 
            success: true, 
            message: 'File processed successfully!', 
            filename: req.file.originalname 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});