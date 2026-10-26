// --- 1. Navigation / Tool Switcher ---
function switchTool(toolId) {
    document.querySelectorAll('.tool-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.sidebar .tool-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetSec = document.getElementById('section-' + toolId);
    if (targetSec) targetSec.style.display = 'block';
}

// --- 2. Dynamic File Name Updaters ---
const setupFileInput = (inputId, labelId, defaultText) => {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('change', (e) => {
            const label = document.getElementById(labelId);
            if (label) {
                if (inputId === 'mergeInput') {
                    label.innerText = e.target.files.length > 0 ? `${e.target.files.length} PDF(s) selected` : defaultText;
                } else {
                    label.innerText = e.target.files[0] ? e.target.files[0].name : defaultText;
                }
            }
        });
    }
};

setupFileInput('mergeInput', 'mergeFileName', 'Select multiple PDF files');
setupFileInput('splitInput', 'splitFileName', 'Select a PDF file');
setupFileInput('rotateInput', 'rotateFileName', 'Select PDF file');
setupFileInput('compInput', 'compFileName', 'Select an Image');
setupFileInput('watermarkInput', 'watermarkFileName', 'Select PDF file');
setupFileInput('imgInput', 'imgFileName', 'Click here to upload image');
setupFileInput('wordInput', 'wordFileName', 'Select Word (.docx) file');
setupFileInput('excelInput', 'excelFileName', 'Select Excel (.xlsx) file');
setupFileInput('protectInput', 'protectFileName', 'Select PDF file');

// --- 3. Client-Side PDF Tools (pdf-lib / browser tools) ---

// Merge PDFs
async function mergePDFs() {
    const files = document.getElementById('mergeInput').files;
    if (files.length < 2) { alert("Please select at least 2 PDF files!"); return; }
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (let file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPAGE_INDICES ? pdf.getPAGE_INDICES() : [...Array(pdf.getPageCount()).keys()]);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const bytes = await mergedPdf.save();
    downloadFile(bytes, "merged-document.pdf", "application/pdf");
}

// Split PDF
async function splitPDF() {
    const file = document.getElementById('splitInput').files[0];
    if (!file) { alert("Please select a PDF file!"); return; }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const subPdf = await PDFLib.PDFDocument.create();
    const [firstPage] = await subPdf.copyPages(pdfDoc, [0]);
    subPdf.addPage(firstPage);
    const bytes = await subPdf.save();
    downloadFile(bytes, "extracted-page.pdf", "application/pdf");
}

// Rotate PDF
async function rotatePDF() {
    const file = document.getElementById('rotateInput').files[0];
    if (!file) { alert("Please select a PDF file!"); return; }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    pdfDoc.getPages().forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(PDFLib.degrees(currentRotation + 90));
    });
    const bytes = await pdfDoc.save();
    downloadFile(bytes, "rotated-document.pdf", "application/pdf");
}

// Compress Image
async function compressImageFile() {
    const file = document.getElementById('compInput').files[0];
    if (!file) { alert("Please select an image!"); return; }
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true };
    try {
        document.getElementById('compResult').innerText = "Compressing...";
        const compressedFile = await imageCompression(file, options);
        const url = URL.createObjectURL(compressedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = "compressed_" + file.name;
        link.click();
        document.getElementById('compResult').innerText = "Compressed Successfully! ✅";
    } catch (error) { alert("Compression failed."); }
}

// Watermark PDF
async function addWatermarkPDF() {
    const file = document.getElementById('watermarkInput').files[0];
    const text = document.getElementById('watermarkText').value.trim();
    if (!file || !text) { alert("Select PDF and enter watermark text!"); return; }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    pdfDoc.getPages().forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(text, { x: width / 4, y: height / 2, size: 40, color: PDFLib.rgb(0.7, 0.7, 0.7), opacity: 0.4, rotate: PDFLib.degrees(45) });
    });
    const bytes = await pdfDoc.save();
    downloadFile(bytes, "watermarked.pdf", "application/pdf");
}

// JPG to PDF
async function convertToPDF() {
    const file = document.getElementById('imgInput').files[0];
    if (!file) { alert("Select an image first!"); return; }
    const reader = new FileReader();
    reader.onload = async function (e) {
        const pdfDoc = await PDFLib.PDFDocument.create();
        const imageBytes = e.target.result;
        let image = file.type === "image/png" ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        const bytes = await pdfDoc.save();
        downloadFile(bytes, "converted.pdf", "application/pdf");
    };
    reader.readAsArrayBuffer(file);
}

// Word Counter
function countText() {
    const text = document.getElementById('textArea').value.trim();
    document.getElementById('wCount').innerText = text === "" ? 0 : text.split(/\s+/).length;
    document.getElementById('cCount').innerText = text.length;
}


// --- 4. Node.js Backend Integration Functions ---

// Test connection with local Node.js backend (Port 5000)
async function testBackendConnection() {
    try {
        let response = await fetch('http://localhost:5000/');
        let data = await response.text();
        console.log("Backend Status: ", data);
    } catch (error) {
        console.log("Backend server is not running yet.");
    }
}

// Run backend connection check on page load
testBackendConnection();

// Example function to send file to Node.js backend for heavy processing
async function sendFileToBackendServer(inputId) {
    const fileInput = document.getElementById(inputId);
    if (!fileInput || !fileInput.files[0]) {
        alert("Pehle file select karein!");
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        let response = await fetch('http://localhost:5000/api/process-pdf', {
            method: 'POST',
            body: formData
        });

        let result = await response.json();
        if (result.success) {
            alert("Success: " + result.message + " (" + result.filename + ")");
        } else {
            alert("Processing failed on server.");
        }
    } catch (err) {
        console.error("Error connecting backend:", err);
        alert("Node.js server se connect nahi ho paya. Please ensure server.js is running.");
    }
}

// Hooking backend processing to Word/Excel/Protect buttons if needed
function convertWordToPDF() { sendFileToBackendServer('wordInput'); }
function convertExcelToPDF() { sendFileToBackendServer('excelInput'); }
function protectPDF() { sendFileToBackendServer('protectInput'); }


// --- 5. Helper Download Function ---
function downloadFile(bytes, filename, mimeType) {
    const blob = new Blob([bytes], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}