// freshq_app.js (Fully corrected, deployment-ready)

let model;
let modelLoaded = false;

document.addEventListener('DOMContentLoaded', async () => {
    const statusElement = document.getElementById('status') || createStatusElement();
    statusElement.textContent = 'Loading AI model...';

    try {
        console.log('Loading model from: ./tfjs_model/model.json');
        model = await tf.loadLayersModel('./tfjs_model/model.json');
        console.log('✅ Model loaded successfully');
        modelLoaded = true;
        statusElement.textContent = 'AI model ready - Upload an image to analyze!';
        statusElement.style.color = '#22c55e';
    } catch (error) {
        console.error('❌ Error loading model:', error);
        statusElement.textContent = 'Error loading AI model. Please refresh the page.';
        statusElement.style.color = '#ef4444';
        alert(`Failed to load model: ${error.message}`);
    }

    renderFeatures();
    lucide.createIcons();
});

function createStatusElement() {
    const statusElement = document.createElement('div');
    statusElement.id = 'status';
    statusElement.style.cssText = 'text-align: center; padding: 10px; font-weight: bold;';
    document.body.prepend(statusElement);
    return statusElement;
}

function renderFeatures() {
    const features = [
        { icon: 'leaf', className: 'text-freshq-green', title: 'Reduce Food Waste', description: 'Extend shelf life and minimize waste.' },
        { icon: 'bar-chart-3', className: 'text-freshq-blue', title: 'Data-Driven Insights', description: 'Make informed decisions with detailed reports.' },
        { icon: 'clock', className: 'text-freshq-green', title: 'Save Time', description: 'Instant assessments without manual inspections.' },
        { icon: 'shield-check', className: 'text-freshq-blue', title: 'Ensure Quality', description: 'Maintain quality standards across supply chains.' }
    ];
    const featureGrid = document.getElementById('featureGrid');
    features.forEach(feature => {
        const div = document.createElement('div');
        div.className = 'feature';
        div.innerHTML = `
            <i data-lucide="${feature.icon}" class="feature-icon ${feature.className}"></i>
            <h3>${feature.title}</h3>
            <p>${feature.description}</p>
        `;
        featureGrid.appendChild(div);
    });
}

function preprocessImage(img) {
    return tf.tidy(() => {
        let tensor = tf.browser.fromPixels(img);
        tensor = tf.image.resizeBilinear(tensor, [224, 224]);
        tensor = tensor.div(255.0);
        return tensor.expandDims(0);
    });
}

window.checkQuality = async () => {
    if (!modelLoaded) {
        alert('Model not loaded yet. Please wait.');
        return;
    }

    const uploadInput = document.getElementById('uploadImage');
    const captureInput = document.getElementById('captureImage');
    const produceSelect = document.getElementById('produceType');
    const resultsDiv = document.getElementById('results');
    const resultImage = document.getElementById('resultImage');
    const imageNameSpan = document.getElementById('imageName');
    const produceNameSpan = document.getElementById('produceName');
    const qualityGradeSpan = document.getElementById('qualityGrade');
    const freshnessFill = document.getElementById('freshnessFill');
    const freshnessScoreSpan = document.getElementById('freshnessScore');
    const shelfLifeSpan = document.getElementById('shelfLife');
    const recommendationsList = document.getElementById('recommendationsList');
    const statusElement = document.getElementById('status');

    const file = uploadInput.files[0] || captureInput.files[0];
    const produce = produceSelect.value;

    if (!file || !produce) {
        alert('Please select produce type and upload an image.');
        return;
    }

    const imgURL = URL.createObjectURL(file);
    resultImage.src = imgURL;

    statusElement.textContent = 'Analyzing image...';
    statusElement.style.color = '#3b82f6';

    try {
        const img = new Image();
        img.src = imgURL;
        await img.decode();

        const inputTensor = preprocessImage(img);
        const prediction = await model.predict(inputTensor);
        const score = (await prediction.data())[0];

        inputTensor.dispose();
        if (prediction.dispose) prediction.dispose();

        const isFresh = score < 0.5;
        const confidence = isFresh ? (1 - score) * 100 : score * 100;
        const freshnessScore = Math.round(confidence);
        const quality = freshnessScore >= 80 ? 'Excellent' : freshnessScore >= 60 ? 'Good' : freshnessScore >= 40 ? 'Fair' : 'Poor';
        const shelfLife = Math.max(2, Math.round(freshnessScore / 2));

        imageNameSpan.textContent = file.name;
        produceNameSpan.textContent = produce;
        qualityGradeSpan.textContent = quality;
        freshnessFill.style.width = `${freshnessScore}%`;
        freshnessScoreSpan.textContent = `${freshnessScore}/100`;
        shelfLifeSpan.textContent = `${shelfLife} days`;

        const recommendations = [
            'Store in a cool, dry place.',
            'Keep away from sunlight.',
            'Check regularly for spoilage.'
        ];
        recommendationsList.innerHTML = recommendations.map(r => `<li>${r}</li>`).join('');

        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });

        statusElement.textContent = `Analysis complete: ${isFresh ? 'Fresh' : 'Rotten'} (${freshnessScore}%)`;
        statusElement.style.color = isFresh ? '#22c55e' : '#ef4444';

    } catch (error) {
        console.error('Prediction error:', error);
        alert(`Error: ${error.message}`);
        statusElement.textContent = 'Error analyzing image.';
        statusElement.style.color = '#ef4444';
    } finally {
        URL.revokeObjectURL(imgURL);
    }
};

window.goBack = () => {
    document.getElementById('results').style.display = 'none';
    document.getElementById('uploadImage').value = '';
    document.getElementById('captureImage').value = '';
    document.getElementById('produceType').value = '';
    document.getElementById('resultImage').src = '';
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = 'AI model ready - Upload an image to analyze!';
        statusElement.style.color = '#22c55e';
    }
};

window.exportToPDF = () => {
    const { jsPDF } = window.jspdf;
    html2canvas(document.getElementById('results'), { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`FreshQ_Report_${new Date().toISOString()}.pdf`);
    }).catch(err => {
        console.error('PDF export error:', err);
        alert('Failed to export PDF.');
    });
};
