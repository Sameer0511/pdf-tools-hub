const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Render par files check karne ke liye debug logs
console.log("Current Directory:", __dirname);
try {
    console.log("Files available:", fs.readdirSync(__dirname));
} catch (e) {
    console.log("Error reading directory:", e.message);
}

// Main folder aur static files ke liye setup
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'Smart-Tool-Website')));

const upload = multer({ dest: 'uploads/' });

// Root URL par index.html / index.HTML serve karega (Fallback ke sath)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.HTML'), (err) => {
        if (err) {
            // Agar capital HTML na mile toh chote letters wala try karega
            res.sendFile(path.join(__dirname, 'index.html'), (err2) => {
                if (err2) {
                    res.status(404).send('index.html not found! Please check logs.');
                }
            });
        }
    });
});

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