let model;

document.addEventListener('DOMContentLoaded', async () => {
    const featureGrid = document.getElementById('featureGrid');
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

    // Load model on page load
    try {
        console.log("Loading model from: tfjs_model/model.json");
        model = await tf.loadLayersModel('tfjs_model/model.json');
        console.log("Model loaded successfully");
    } catch (error) {
        console.error("Error loading model:", error);
        alert(`Failed to load model: ${error.message}. Please ensure the model files are in the tfjs_model/ directory.`);
    }

    // Feature rendering
    const features = [
        { icon: 'leaf', className: 'text-freshq-green', title: 'Reduce Food Waste', description: 'Optimize storage conditions to extend produce shelf life and minimize waste.' },
        { icon: 'bar-chart-3', className: 'text-freshq-blue', title: 'Data-Driven Insights', description: 'Make informed decisions with detailed quality reports and analytics.' },
        { icon: 'clock', className: 'text-freshq-green', title: 'Save Time', description: 'Get instant quality assessments without manual inspection processes.' },
        { icon: 'shield-check', className: 'text-freshq-blue', title: 'Ensure Quality', description: 'Maintain consistent quality standards throughout the supply chain.' }
    ];

    features.forEach(feature => {
        const featureDiv = document.createElement('div');
        featureDiv.className = 'feature';
        featureDiv.innerHTML = `
            <i data-lucide="${feature.icon}" class="feature-icon ${feature.className}" aria-hidden="true"></i>
            <h3>${feature.title}</h3>
            <p>${feature.description}</p>
        `;
        featureGrid.appendChild(featureDiv);
    });

    lucide.createIcons();

    // File input label click fallback
    document.querySelectorAll('.file-label').forEach(label => {
        label.addEventListener('click', () => {
            const inputId = label.getAttribute('for');
            document.getElementById(inputId).click();
        });
    });
});

// Check quality function
window.checkQuality = async () => {
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

    if (!model) {
        alert("Model not loaded. Please refresh the page or check the console for errors.");
        return;
    }

    const file = uploadInput.files[0] || captureInput.files[0];
    const selectedProduce = produceSelect.value;

    if (!selectedProduce) {
        alert("Please select a produce type!");
        return;
    }

    if (!file) {
        alert("Please upload or capture an image!");
        return;
    }

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        alert("Please upload or capture a valid image (JPEG or PNG).");
        return;
    }

    resultsDiv.style.display = 'none';
    const imageSrc = URL.createObjectURL(file);
    resultImage.src = imageSrc;

    try {
        const img = new Image();
        img.src = imageSrc;
        await new Promise(resolve => img.onload = resolve);

        const tensor = tf.browser.fromPixels(img)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .div(255.0)
            .expandDims();

        const prediction = model.predict(tensor).dataSync()[0];
        const label = prediction > 0.5 ? "Rotten" : "Fresh";
        const confidence = prediction > 0.5 ? (prediction * 100).toFixed(2) : ((1 - prediction) * 100).toFixed(2);
        const freshnessScore = label === "Fresh" ? Math.floor(confidence) : Math.floor(100 - confidence);
        const quality = freshnessScore > 80 ? "Best" : freshnessScore > 60 ? "Good" : "Fair";
        const shelfLife = label === "Fresh" ? Math.floor(Math.random() * 10) + 20 : Math.floor(Math.random() * 5) + 5;
        const recommendations = [
            'Store in a cool, dry place when possible.',
            'Keep away from direct sunlight.',
            'Store at 0-4°C and 90-95% humidity.',
            'Keep away from ethylene-sensitive produce like broccoli.',
            'For long-term storage, refrigerate in perforated plastic bags.'
        ];

        imageNameSpan.textContent = file.name;
        produceNameSpan.textContent = selectedProduce;
        qualityGradeSpan.textContent = quality;
        freshnessFill.style.width = `${freshnessScore}%`;
        freshnessScoreSpan.textContent = `${freshnessScore}/100`;
        shelfLifeSpan.textContent = `${shelfLife} days`;
        recommendationsList.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error("Error during prediction:", error);
        alert(`Error during prediction: ${error.message}`);
        goBack();
    }
};

// Export to PDF function
window.exportToPDF = () => {
    const resultsDiv = document.getElementById('results');
    const { jsPDF } = window.jspdf;

    html2canvas(resultsDiv, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const margin = 10;
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        pdf.save(`FreshQ_Assessment_${new Date().toISOString()}.pdf`);
    }).catch(error => {
        alert('Error generating PDF. Please try again.');
        console.error(error);
    });
};

// Go back function
window.goBack = () => {
    const resultsDiv = document.getElementById('results');
    const resultImage = document.getElementById('resultImage');
    const uploadInput = document.getElementById('uploadImage');
    const captureInput = document.getElementById('captureImage');
    const produceSelect = document.getElementById('produceType');

    resultsDiv.style.display = 'none';
    resultImage.src = '';
    uploadInput.value = '';
    captureInput.value = '';
    produceSelect.value = '';
};