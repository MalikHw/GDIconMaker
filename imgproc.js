let histStack = [];
let histIdx = -1;
let procsdImgs = [];
let currCropIdx = -1;
let allFiles = [];
let cropRct = {x:0,y:0,size:0};
let isDrag = false;
let isRsz = false;
let dragStrt = {x:0,y:0};
let rszCorner = null;
let currImg = null;
let imgScale = 1;
let savedCrop = null;

function initImgProc() {
    const fileIn = document.getElementById('iconImage');
    const imgPrev = document.getElementById('imagePreview');
    const cropMdl = document.getElementById('cropModal');
    
    fileIn.addEventListener('change', async function(e) {
        const fls = Array.from(e.target.files);
        
        if(fls.length > 400) {
            alert('max 400 pics bro');
            fileIn.value = '';
            return;
        }

        for(let f of fls) {
            if(f.size > 5*1024*1024) {
                alert(`${f.name} is too thicc (>5MB), shrink it down bro`);
                fileIn.value = '';
                return;
            }
        }
        
        if(fls.length > 5) {
            const rslt = document.getElementById('result');
            rslt.className = 'result warning';
            rslt.innerHTML = '<p>⚠️ yo thats a lot of pics, might take a sec...</p>';
        }

        procsdImgs = [];
        imgPrev.innerHTML = '';
        allFiles = [];
        
        for(let fl of fls) {
            if(fl.type === 'image/gif') {
                try {
                    const firstFrame = await getGifFirstFrame(fl);
                    const newFile = new File([firstFrame.blob], fl.name.replace('.gif', '.png'), {type: 'image/png'});
                    allFiles.push(newFile);
                } catch(err) {
                    console.log('gif conversion failed:', err);
                    allFiles.push(fl);
                }
            } else {
                allFiles.push(fl);
            }
        }
        
        currCropIdx = 0;
        savedCrop = null;
        
        procNextImg();
    });
}

function procNextImg() {
    if(currCropIdx >= allFiles.length) {
        dispAllPrevs();
        return;
    }

    const fl = allFiles[currCropIdx];
    const rdr = new FileReader();
    
    rdr.onload = function(evt) {
        const im = new Image();
        im.onload = function() {
            if(im.width < 108 || im.height < 108) {
                const rslt = document.getElementById('result');
                rslt.className = 'result warning';
                rslt.innerHTML = `<p>⚠️ pic ${currCropIdx + 1} is ${im.width}x${im.height}px, quality gonna be shit lol</p>`;
            }

            if(im.width !== im.height) {
                showCropMdl(im, evt.target.result);
            } else {
                const resized = resizeImgToSquare(im, 512);
                procsdImgs.push({
                    data: resized,
                    filename: fl.name
                });
                currCropIdx++;
                procNextImg();
            }
        };
        im.src = evt.target.result;
    };
    rdr.readAsDataURL(fl);
}

function resizeImgToSquare(img, targetSz) {
    const canv = document.createElement('canvas');
    canv.width = targetSz;
    canv.height = targetSz;
    const ctx = canv.getContext('2d');
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, 0, 0, targetSz, targetSz);
    return canv.toDataURL('image/png');
}

function dispAllPrevs() {
    const imgPrev = document.getElementById('imagePreview');
    imgPrev.innerHTML = '';
    procsdImgs.forEach((im, idx) => {
        const prvItem = document.createElement('div');
        prvItem.className = 'preview-item';
        prvItem.innerHTML = `
            <img src="${im.data}" alt="Icon ${idx + 1}">
            <div class="remove-image" data-index="${idx}">×</div>
            <input type="number" class="icon-number" data-index="${idx}" value="${idx + 1}" min="1" max="400" placeholder="#">
        `;
        imgPrev.appendChild(prvItem);
    });

    document.querySelectorAll('.remove-image').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            procsdImgs.splice(idx, 1);
            dispAllPrevs();
            
            if(procsdImgs.length === 0) {
                document.getElementById('iconImage').value = '';
            }
        });
    });

    document.querySelectorAll('.icon-number').forEach(inp => {
        inp.addEventListener('change', function() {
            const idx = parseInt(this.dataset.index);
            let val = parseInt(this.value);
            if(val < 1) val = 1;
            if(val > 400) val = 400;
            this.value = val;
            procsdImgs[idx].customNum = val;
        });
    });
}

function showCropMdl(im, imgSrc) {
    const cropMdl = document.getElementById('cropModal');
    const cropCanv = document.getElementById('cropCanvas');
    const ctx = cropCanv.getContext('2d');
    const cropProg = document.getElementById('cropProgress');
    
    currImg = im;
    cropProg.textContent = `pic ${currCropIdx + 1} of ${allFiles.length}`;
    
    histStack = [];
    histIdx = -1;
    
    const maxSz = 600;
    imgScale = 1;
    if(im.width > maxSz || im.height > maxSz) {
        imgScale = maxSz / Math.max(im.width, im.height);
    }
    
    cropCanv.width = im.width * imgScale;
    cropCanv.height = im.height * imgScale;
    
    ctx.drawImage(im, 0, 0, cropCanv.width, cropCanv.height);
    
    if(savedCrop) {
        const sz = Math.min(cropCanv.width, cropCanv.height) * savedCrop.sizePct;
        cropRct = {
            x: cropCanv.width * savedCrop.xPct,
            y: cropCanv.height * savedCrop.yPct,
            size: sz
        };
    } else {
        const sz = Math.min(cropCanv.width, cropCanv.height) * 0.8;
        cropRct = {
            x: (cropCanv.width - sz) / 2,
            y: (cropCanv.height - sz) / 2,
            size: sz
        };
    }
    
    saveCropHist();
    drawCropOvrly();
    cropMdl.classList.add('active');
    
    setupCropEvts();
}

function saveCropHist() {
    histStack = histStack.slice(0, histIdx + 1);
    histStack.push({...cropRct});
    histIdx++;
    updtUndoRedoBtns();
}

function updtUndoRedoBtns() {
    document.getElementById('undoCrop').disabled = histIdx <= 0;
    document.getElementById('redoCrop').disabled = histIdx >= histStack.length - 1;
}

function drawCropOvrly() {
    const cropCanv = document.getElementById('cropCanvas');
    const ctx = cropCanv.getContext('2d');
    
    ctx.clearRect(0, 0, cropCanv.width, cropCanv.height);
    ctx.drawImage(currImg, 0, 0, cropCanv.width, cropCanv.height);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, cropCanv.width, cropCanv.height);
    
    ctx.clearRect(cropRct.x, cropRct.y, cropRct.size, cropRct.size);
    ctx.drawImage(currImg, 
        cropRct.x / imgScale, cropRct.y / imgScale, 
        cropRct.size / imgScale, cropRct.size / imgScale,
        cropRct.x, cropRct.y, cropRct.size, cropRct.size
    );
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(cropRct.x, cropRct.y, cropRct.size, cropRct.size);
    
    const hndsz = 12;
    ctx.fillStyle = '#667eea';
    ctx.fillRect(cropRct.x - hndsz/2, cropRct.y - hndsz/2, hndsz, hndsz);
    ctx.fillRect(cropRct.x + cropRct.size - hndsz/2, cropRct.y - hndsz/2, hndsz, hndsz);
    ctx.fillRect(cropRct.x - hndsz/2, cropRct.y + cropRct.size - hndsz/2, hndsz, hndsz);
    ctx.fillRect(cropRct.x + cropRct.size - hndsz/2, cropRct.y + cropRct.size - hndsz/2, hndsz, hndsz);
}

function setupCropEvts() {
    const cropCanv = document.getElementById('cropCanvas');
    const evts = {
        mousedown: hndlMseDown,
        mousemove: hndlMseMove,
        mouseup: hndlMseUp,
        touchstart: hndlTchStart,
        touchmove: hndlTchMove,
        touchend: hndlTchEnd
    };
    
    Object.keys(evts).forEach(evt => {
        cropCanv.removeEventListener(evt, evts[evt]);
        cropCanv.addEventListener(evt, evts[evt]);
    });
}

function hndlMseDown(e) {
    const cropCanv = document.getElementById('cropCanvas');
    const rct = cropCanv.getBoundingClientRect();
    const x = e.clientX - rct.left;
    const y = e.clientY - rct.top;
    startCropInteract(x, y);
}

function hndlTchStart(e) {
    e.preventDefault();
    const cropCanv = document.getElementById('cropCanvas');
    const rct = cropCanv.getBoundingClientRect();
    const tch = e.touches[0];
    const x = tch.clientX - rct.left;
    const y = tch.clientY - rct.top;
    startCropInteract(x, y);
}

function startCropInteract(x, y) {
    const hndsz = 20;
    const corners = [
        {x: cropRct.x, y: cropRct.y, name: 'tl'},
        {x: cropRct.x + cropRct.size, y: cropRct.y, name: 'tr'},
        {x: cropRct.x, y: cropRct.y + cropRct.size, name: 'bl'},
        {x: cropRct.x + cropRct.size, y: cropRct.y + cropRct.size, name: 'br'}
    ];
    
    for(const c of corners) {
        if(x >= c.x - hndsz && x <= c.x + hndsz && y >= c.y - hndsz && y <= c.y + hndsz) {
            isRsz = true;
            rszCorner = c.name;
            dragStrt = {x, y, origRct: {...cropRct}};
            return;
        }
    }
    
    if(x >= cropRct.x && x <= cropRct.x + cropRct.size &&
        y >= cropRct.y && y <= cropRct.y + cropRct.size) {
        isDrag = true;
        dragStrt = {x: x - cropRct.x, y: y - cropRct.y};
    }
}

function hndlMseMove(e) {
    const cropCanv = document.getElementById('cropCanvas');
    const rct = cropCanv.getBoundingClientRect();
    const x = e.clientX - rct.left;
    const y = e.clientY - rct.top;
    moveCropInteract(x, y);
}

function hndlTchMove(e) {
    e.preventDefault();
    const cropCanv = document.getElementById('cropCanvas');
    const rct = cropCanv.getBoundingClientRect();
    const tch = e.touches[0];
    const x = tch.clientX - rct.left;
    const y = tch.clientY - rct.top;
    moveCropInteract(x, y);
}

function moveCropInteract(x, y) {
    if(!isDrag && !isRsz) return;
    
    if(isRsz) {
        const dx = x - dragStrt.x;
        const dy = y - dragStrt.y;
        const orig = dragStrt.origRct;
        
        let newX = orig.x;
        let newY = orig.y;
        let newSz = orig.size;
        
        if(rszCorner === 'br') {
            const cropCanv = document.getElementById('cropCanvas');
            newSz = Math.min(orig.size + Math.max(dx, dy), cropCanv.width - orig.x, cropCanv.height - orig.y);
        } else if(rszCorner === 'bl') {
            const cropCanv = document.getElementById('cropCanvas');
            const chng = Math.min(-dx, dy);
            newSz = Math.min(orig.size + chng, cropCanv.width - orig.x, orig.y + orig.size);
            newX = orig.x + orig.size - newSz;
        } else if(rszCorner === 'tr') {
            const cropCanv = document.getElementById('cropCanvas');
            const chng = Math.min(dx, -dy);
            newSz = Math.min(orig.size + chng, cropCanv.width - orig.x, orig.y + orig.size);
            newY = orig.y + orig.size - newSz;
        } else if(rszCorner === 'tl') {
            const chng = Math.min(-dx, -dy);
            newSz = Math.min(orig.size + chng, orig.x + orig.size, orig.y + orig.size);
            newX = orig.x + orig.size - newSz;
            newY = orig.y + orig.size - newSz;
        }
        
        cropRct = {x: newX, y: newY, size: newSz};
    } else {
        const cropCanv = document.getElementById('cropCanvas');
        cropRct.x = Math.max(0, Math.min(x - dragStrt.x, cropCanv.width - cropRct.size));
        cropRct.y = Math.max(0, Math.min(y - dragStrt.y, cropCanv.height - cropRct.size));
    }
    
    drawCropOvrly();
}

function hndlMseUp() {
    endCropInteract();
}

function hndlTchEnd() {
    endCropInteract();
}

function endCropInteract() {
    if(isDrag || isRsz) {
        saveCropHist();
    }
    isDrag = false;
    isRsz = false;
    rszCorner = null;
}

function setupCropBtns() {
    document.getElementById('undoCrop').addEventListener('click', () => {
        if(histIdx > 0) {
            histIdx--;
            cropRct = {...histStack[histIdx]};
            drawCropOvrly();
            updtUndoRedoBtns();
        }
    });

    document.getElementById('redoCrop').addEventListener('click', () => {
        if(histIdx < histStack.length - 1) {
            histIdx++;
            cropRct = {...histStack[histIdx]};
            drawCropOvrly();
            updtUndoRedoBtns();
        }
    });

    document.getElementById('resetCrop').addEventListener('click', () => {
        const cropCanv = document.getElementById('cropCanvas');
        const sz = Math.min(cropCanv.width, cropCanv.height) * 0.8;
        cropRct = {
            x: (cropCanv.width - sz) / 2,
            y: (cropCanv.height - sz) / 2,
            size: sz
        };
        saveCropHist();
        drawCropOvrly();
    });

    document.getElementById('applyCropAll').addEventListener('click', applyCrpAll);
    document.getElementById('confirmCrop').addEventListener('click', confirmCrp);
    document.getElementById('cancelCrop').addEventListener('click', skipCrp);
    
    document.addEventListener('keydown', (e) => {
        const cropMdl = document.getElementById('cropModal');
        if(!cropMdl.classList.contains('active')) return;
        if(e.key === 'Enter') confirmCrp();
        if(e.key === 'Escape') skipCrp();
        if(e.key === 'r' || e.key === 'R') document.getElementById('resetCrop').click();
        if(e.key === 'a' || e.key === 'A') applyCrpAll();
    });
}

function applyCrpAll() {
    const cropCanv = document.getElementById('cropCanvas');
    savedCrop = {
        xPct: cropRct.x / cropCanv.width,
        yPct: cropRct.y / cropCanv.height,
        sizePct: cropRct.size / Math.min(cropCanv.width, cropCanv.height)
    };
    
    confirmCrp();
}

function confirmCrp() {
    const crpdCanv = document.createElement('canvas');
    crpdCanv.width = cropRct.size;
    crpdCanv.height = cropRct.size;
    const crpdCtx = crpdCanv.getContext('2d');
    
    crpdCtx.drawImage(currImg,
        cropRct.x / imgScale, cropRct.y / imgScale,
        cropRct.size / imgScale, cropRct.size / imgScale,
        0, 0, cropRct.size, cropRct.size
    );
    
    const resized = resizeImgToSquare(crpdCanv, 512);
    
    procsdImgs.push({
        data: resized,
        filename: `icon_${currCropIdx + 1}.png`
    });
    
    closeCropMdl();
}

function skipCrp() {
    closeCropMdl();
}

function closeCropMdl() {
    const cropMdl = document.getElementById('cropModal');
    cropMdl.classList.remove('active');
    currCropIdx++;
    setTimeout(() => procNextImg(), 100);
}

function getGifFirstFrame(file) {
    return new Promise((resolve, reject) => {
        const rdr = new FileReader();
        rdr.onload = function(evt) {
            const im = new Image();
            im.onload = function() {
                const canv = document.createElement('canvas');
                canv.width = im.width;
                canv.height = im.height;
                const ctx = canv.getContext('2d');
                ctx.drawImage(im, 0, 0);
                canv.toBlob((blob) => {
                    resolve({
                        blob: blob,
                        dataUrl: canv.toDataURL('image/png'),
                        width: im.width,
                        height: im.height
                    });
                }, 'image/png');
            };
            im.onerror = reject;
            im.src = evt.target.result;
        };
        rdr.onerror = reject;
        rdr.readAsDataURL(file);
    });
}

function getProcsdImgs() {
    return procsdImgs;
}
