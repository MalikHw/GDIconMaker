document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('iconForm');
    const fileInput = document.getElementById('iconImage');
    const imagePreview = document.getElementById('imagePreview');
    const cropContainer = document.getElementById('cropContainer');
    const cropCanvas = document.getElementById('cropCanvas');
    const ctx = cropCanvas.getContext('2d');
    const submitBtn = document.getElementById('submitBtn');
    const result = document.getElementById('result');
    
    let processedImages = []; // Array to store all processed images
    let currentCropIndex = -1;
    let cropRect = { x: 0, y: 0, size: 0 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    // Tutorial dropdown toggle
    const tutorialToggle = document.getElementById('tutorialToggle');
    const tutorialContent = document.getElementById('tutorialContent');
    
    tutorialToggle.addEventListener('click', function() {
        tutorialToggle.classList.toggle('active');
        tutorialContent.classList.toggle('active');
    });

    // Load and display stats
    loadStats();
    
    // Increment visit counter on page load
    fetch('stats.php?action=visit')
        .then(r => r.json())
        .then(data => {
            if (data.success) updateStatsDisplay(data.stats);
        })
        .catch(e => console.log('Stats error:', e));

    function loadStats() {
        fetch('stats.php?action=get')
            .then(r => r.json())
            .then(data => {
                if (data.success) updateStatsDisplay(data.stats);
            })
            .catch(e => console.log('Stats error:', e));
    }

    function updateStatsDisplay(stats) {
        document.getElementById('totalVisits').textContent = stats.total_visits.toLocaleString();
        document.getElementById('totalIcons').textContent = stats.total_icons.toLocaleString();
    }

    // Multi-image file selection
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        if (files.length > 99) {
            alert('Maximum 99 images allowed!');
            fileInput.value = '';
            return;
        }

        processedImages = [];
        imagePreview.innerHTML = '';
        currentCropIndex = 0;
        
        processNextImage(files);
    });

    function processNextImage(files) {
        if (currentCropIndex >= files.length) {
            // All images processed
            displayAllPreviews();
            return;
        }

        const file = files[currentCropIndex];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Warn if image is small
                if (img.width < 108 || img.height < 108) {
                    result.className = 'result warning';
                    result.innerHTML = `
                        <p>⚠️ Warning: Image ${currentCropIndex + 1} is ${img.width}x${img.height}px. Quality will be shit! Recommended minimum: 108x108px</p>
                    `;
                }

                // Check if image is square
                if (img.width !== img.height) {
                    // Show crop UI
                    showCropUI(img, event.target.result, files);
                } else {
                    // Square image, add to processed array
                    processedImages.push({
                        data: event.target.result,
                        filename: file.name
                    });
                    currentCropIndex++;
                    processNextImage(files);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function displayAllPreviews() {
        imagePreview.innerHTML = '';
        processedImages.forEach((img, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${img.data}" alt="Icon ${index + 1}">
                <div class="remove-image" data-index="${index}">×</div>
                <p style="font-size: 11px; margin-top: 5px; color: #666;">Icon ${index + 1}</p>
            `;
            imagePreview.appendChild(previewItem);
        });

        // Add remove functionality
        document.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                processedImages.splice(index, 1);
                displayAllPreviews();
                
                if (processedImages.length === 0) {
                    fileInput.value = '';
                }
            });
        });

        cropContainer.style.display = 'none';
    }

    function showCropUI(img, imageSrc, files) {
        cropContainer.style.display = 'block';
        
        const maxSize = 500;
        let scale = 1;
        if (img.width > maxSize || img.height > maxSize) {
            scale = maxSize / Math.max(img.width, img.height);
        }
        
        cropCanvas.width = img.width * scale;
        cropCanvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, cropCanvas.width, cropCanvas.height);
        
        const size = Math.min(cropCanvas.width, cropCanvas.height) * 0.8;
        cropRect = {
            x: (cropCanvas.width - size) / 2,
            y: (cropCanvas.height - size) / 2,
            size: size,
            scale: scale,
            img: img,
            files: files
        };
        
        drawCropOverlay();
    }

    function drawCropOverlay() {
        ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        ctx.drawImage(cropRect.img, 0, 0, cropCanvas.width, cropCanvas.height);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
        
        ctx.clearRect(cropRect.x, cropRect.y, cropRect.size, cropRect.size);
        ctx.drawImage(cropRect.img, 
            cropRect.x / cropRect.scale, cropRect.y / cropRect.scale, 
            cropRect.size / cropRect.scale, cropRect.size / cropRect.scale,
            cropRect.x, cropRect.y, cropRect.size, cropRect.size
        );
        
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.strokeRect(cropRect.x, cropRect.y, cropRect.size, cropRect.size);
        
        const handleSize = 10;
        ctx.fillStyle = '#667eea';
        ctx.fillRect(cropRect.x - handleSize/2, cropRect.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(cropRect.x + cropRect.size - handleSize/2, cropRect.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(cropRect.x - handleSize/2, cropRect.y + cropRect.size - handleSize/2, handleSize, handleSize);
        ctx.fillRect(cropRect.x + cropRect.size - handleSize/2, cropRect.y + cropRect.size - handleSize/2, handleSize, handleSize);
    }

    cropCanvas.addEventListener('mousedown', function(e) {
        const rect = cropCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= cropRect.x && x <= cropRect.x + cropRect.size &&
            y >= cropRect.y && y <= cropRect.y + cropRect.size) {
            isDragging = true;
            dragStart = { x: x - cropRect.x, y: y - cropRect.y };
        }
    });

    cropCanvas.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const rect = cropCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        cropRect.x = Math.max(0, Math.min(x - dragStart.x, cropCanvas.width - cropRect.size));
        cropRect.y = Math.max(0, Math.min(y - dragStart.y, cropCanvas.height - cropRect.size));
        
        drawCropOverlay();
    });

    cropCanvas.addEventListener('mouseup', function() {
        isDragging = false;
    });

    document.getElementById('confirmCrop').addEventListener('click', function() {
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropRect.size;
        croppedCanvas.height = cropRect.size;
        const croppedCtx = croppedCanvas.getContext('2d');
        
        croppedCtx.drawImage(cropRect.img,
            cropRect.x / cropRect.scale, cropRect.y / cropRect.scale,
            cropRect.size / cropRect.scale, cropRect.size / cropRect.scale,
            0, 0, cropRect.size, cropRect.size
        );
        
        const croppedImageData = croppedCanvas.toDataURL('image/png');
        
        processedImages.push({
            data: croppedImageData,
            filename: `icon_${currentCropIndex + 1}.png`
        });
        
        currentCropIndex++;
        processNextImage(cropRect.files);
    });

    document.getElementById('cancelCrop').addEventListener('click', function() {
        currentCropIndex++;
        processNextImage(cropRect.files);
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (processedImages.length === 0) {
            alert('Please select at least one image!');
            return;
        }

        const formData = new FormData();
        
        // Convert all images to blobs and add to formData
        for (let i = 0; i < processedImages.length; i++) {
            const blob = await (await fetch(processedImages[i].data)).blob();
            formData.append('iconImages[]', blob, `icon_${i}.png`);
        }
        
        formData.append('packName', document.getElementById('packName').value);
        formData.append('packAuthor', document.getElementById('packAuthor').value);
        
        submitBtn.disabled = true;
        document.querySelector('.btn-text').style.display = 'none';
        document.querySelector('.btn-loading').style.display = 'inline';

        try {
            const response = await fetch('process.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Increment icons counter
                fetch(`stats.php?action=icon`)
                    .then(r => r.json())
                    .then(d => {
                        if (d.success) updateStatsDisplay(d.stats);
                    });
                
                showDonationModal(data.downloadUrl, data.filename, data.message);
            } else {
                result.className = 'result error';
                result.innerHTML = `
                    <h3>✗ Error</h3>
                    <p>${data.message}</p>
                `;
            }
        } catch (error) {
            result.className = 'result error';
            result.innerHTML = `
                <h3>✗ Error</h3>
                <p>An unexpected error occurred. Please try again.</p>
            `;
        } finally {
            submitBtn.disabled = false;
            document.querySelector('.btn-text').style.display = 'inline';
            document.querySelector('.btn-loading').style.display = 'none';
        }
    });

    // Custom donation modal with auto-delete
    function showDonationModal(downloadUrl, filename, message) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <i class="nf nf-fa-check_circle" style="color: #28a745; font-size: 48px;"></i>
                    <h2>🎉 Your Icon Pack is Ready!</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
                        💝 This tool is <strong>100% free</strong>, but if you found it helpful, 
                        please consider supporting the developer!
                    </p>
                    <div class="modal-buttons">
                        <a href="https://malikhw.github.io/donate" target="_blank" class="modal-btn donate-btn">
                            <i class="nf nf-fa-heart"></i> Support the Developer
                        </a>
                        <button type="button" class="modal-btn download-btn" id="justDownload">
                            <i class="nf nf-fa-download"></i> Just Download
                        </button>
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 15px;">
                        Your download will start automatically when you click either button
                    </p>
                </div>
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        setTimeout(() => modalOverlay.classList.add('active'), 10);
        
        function handleDownload() {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Auto-delete the ZIP file after download
            fetch('delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: downloadUrl })
            });
            
            modalOverlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modalOverlay);
                
                result.className = 'result success';
                result.innerHTML = `
                    <h3>✓ Success!</h3>
                    <p>${message}</p>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">
                        <i class="nf nf-fa-info_circle"></i> File has been auto-deleted from server for your privacy
                    </p>
                `;
            }, 300);
        }
        
        modal.querySelector('.donate-btn').addEventListener('click', handleDownload);
        document.getElementById('justDownload').addEventListener('click', handleDownload);
    }
});
