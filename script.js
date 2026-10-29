// Tool switching logic
function switchTool(toolName) {
    document.querySelectorAll('.tool-section').forEach(sec => sec.style.display = 'none');
    const target = document.getElementById('section-' + toolName);
    if (target) target.style.display = 'block';

    const resultBox = document.getElementById('resultContainer');
    if (resultBox) resultBox.style.display = 'none';

    document.querySelectorAll('.sidebar .tool-btn').forEach(btn => btn.classList.remove('active'));
}

// Multiple file array storage
let selectedMergeFiles = [];
let selectedImages = [];

function handleFileSelect(event, type) {
    const files = Array.from(event.target.files);
    if (type === 'merge') {
        selectedMergeFiles = selectedMergeFiles.concat(files);
        const listContainer = document.getElementById('mergeFileList');
        listContainer.innerHTML = selectedMergeFiles.map(f => `<div>📄 ${f.name}</div>`).join('');
        document.getElementById('mergeFileName').innerText = `${selectedMergeFiles.length} files selected`;
    } else if (type === 'img') {
        selectedImages = selectedImages.concat(files);
        const listContainer = document.getElementById('imgFileList');
        listContainer.innerHTML = selectedImages.map(f => `<div>🖼️ ${f.name}</div>`).join('');
        document.getElementById('imgFileName').innerText = `${selectedImages.length} images selected`;
    }
}

// Universal function for Preview & Manual Download Button
function showResult(blob, fileName, fileType = 'pdf') {
    const resultContainer = document.getElementById('resultContainer');
    const resultFileName = document.getElementById('resultFileName');
    const downloadBtn = document.getElementById('downloadBtn');
    const previewArea = document.getElementById('previewArea');

    resultContainer.style.display = 'block';
    resultFileName.innerText = `File Name: ${fileName}`;

    const fileUrl = URL.createObjectURL(blob);
    downloadBtn.href = fileUrl;
    downloadBtn.download = fileName;

    previewArea.innerHTML = '';
    if (fileType === 'pdf') {
        previewArea.innerHTML = `<iframe src="${fileUrl}" style="width: 100%; height: 200px; border: none; border-radius: 5px;"></iframe>`;
    } else if (fileType === 'image') {
        previewArea.innerHTML = `<img src="${fileUrl}" style="max-width: 100%; max-height: 200px; border-radius: 5px;" />`;
    }

    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Merge PDFs
async function mergePDFs() {
    if (selectedMergeFiles.length < 2) {
        alert('Kripya kam se kam 2 PDF files select karein!');
        return;
    }
    try {
        const mergedPdf = await PDFLib.PDFDocument.create();
        for (let file of selectedMergeFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        showResult(blob, 'merged_document.pdf', 'pdf');
    } catch (err) {
        alert('Error merging PDFs: ' + err.message);
    }
}

// Protect PDF
async function protectPDF() {
    const fileInput = document.getElementById('protectInput');
    const password = document.getElementById('protectPassword').value;
    if (!fileInput.files.length) { alert('Pehle PDF file select karein!'); return; }
    if (!password) { alert('Kripya password darj karein!'); return; }

    const file = fileInput.files[0];
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        showResult(blob, 'protected_' + file.name, 'pdf');
    } catch (err) {
        alert('Error locking PDF: ' + err.message);
    }
}

// Unlock PDF
async function unlockPDF() {
    const fileInput = document.getElementById('unlockInput');
    const password = document.getElementById('unlockPassword').value;
    if (!fileInput.files.length) { alert('Pehle protected PDF file select karein!'); return; }

    const file = fileInput.files[0];
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { password: password });
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        showResult(blob, 'unlocked_' + file.name, 'pdf');
    } catch (err) {
        alert('Galat password ya un-encrypted file! Error: ' + err.message);
    }
}

// Word Count
function countText() {
    const text = document.getElementById('textArea').value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    document.getElementById('wCount').innerText = words;
    document.getElementById('cCount').innerText = chars;
}