document.addEventListener('DOMContentLoaded', function() {
    const frm = document.getElementById('iconForm');
    const fileIn = document.getElementById('iconImage');
    const imgPrev = document.getElementById('imagePreview');
    const cropMdl = document.getElementById('cropModal');
    const cropCanv = document.getElementById('cropCanvas');
    const ctx = cropCanv.getContext('2d');
    const submitBt = document.getElementById('submitBtn');
    const rslt = document.getElementById('result');
    const dropZone = document.getElementById('dropZone');
    const prevBox = document.getElementById('previewBox');
    const prevCanv = document.getElementById('previewCanvas');
    const prevCtx = prevCanv.getContext('2d');
    const cropProg = document.getElementById('cropProgress');
    const authIn = document.getElementById('packAuthor');
    const packIconIn = document.getElementById('packIcon');
    const packIconPrev = document.getElementById('packIconPreview');
    const packIconImg = document.getElementById('packIconImg');
    
    let procsdImgs = [];
    let currCropIdx = -1;
    let allFiles = [];
    let cropRct = { x: 0, y: 0, size: 0 };
    let isDrag = false;
    let isRsz = false;
    let dragStrt = { x: 0, y: 0 };
    let rszCorner = null;
    let currImg = null;
    let imgScale = 1;

    const savedAuth = localStorage.getItem('gdIconAuthor');
    if (savedAuth) {
        authIn.value = savedAuth;
    }

    authIn.addEventListener('change', function() {
        localStorage.setItem('gdIconAuthor', this.value);
    });

    packIconIn.addEventListener('change', function(e) {
        const fl = e.target.files[0];
        if (!fl) return;
        
        const rdr = new FileReader();
        rdr.onload = function(evt) {
            packIconImg.src = evt.target.result;
            packIconPrev.style.display = 'block';
        };
        rdr.readAsDataURL(fl);
    });

    document.getElementById('removePackIcon').addEventListener('click', function() {
        packIconIn.value = '';
        packIconPrev.style.display = 'none';
        packIconImg.src = '';
    });

    const noBallChk = document.getElementById('noBall');
    const ballOnlyChk = document.getElementById('ballOnly');

    noBallChk.addEventListener('change', function() {
        if (this.checked) ballOnlyChk.checked = false;
    });

    ballOnlyChk.addEventListener('change', function() {
        if (this.checked) noBallChk.checked = false;
    });

    document.getElementById('tutorialToggle').addEventListener('click', function() {
        this.classList.toggle('active');
        document.getElementById('tutorialContent').classList.toggle('active');
    });

    loadStts();
    loadYT();
    
    fetch('stats.php?action=visit')
        .then(r => r.json())
        .then(d => {
            if (d.success) updtStts(d.stats);
        })
        .catch(e => console.log('stats err:', e));

    function loadStts() {
        fetch('stats.php?action=get')
            .then(r => r.json())
            .then(d => {
                if (d.success) updtStts(d.stats);
            })
            .catch(e => console.log('stats err:', e));
    }

    function updtStts(stts) {
        document.getElementById('totalVisits').textContent = stts.total_visits.toLocaleString();
        document.getElementById('totalIcons').textContent = stts.total_icons.toLocaleString();
    }

    function loadYT() {
        fetch('ytconfig.php')
            .then(r => r.json())
            .then(d => {
                const ytCont = document.getElementById('youtubeEmbed');
                if (d.visible && d.videoId) {
                    ytCont.innerHTML = `<iframe src="https://www.youtube.com/embed/${d.videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                } else {
                    ytCont.innerHTML = `
                        <div class="youtube-placeholder">
                            <i class="nf nf-fa-video_camera"></i>
                            <p>we're looking for anyone who can do the yt tutorial video!</p>
                            <a href="https://forms.gle/3jY4UEEc5tBVBVWm7" target="_blank">
                                <i class="nf nf-fa-external_link"></i> help us out
                            </a>
                        </div>
                    `;
                }
            })
            .catch(e => {
                document.getElementById('youtubeEmbed').innerHTML = `
                    <div class="youtube-placeholder">
                        <i class="nf nf-fa-video_camera"></i>
                        <p>we're looking for anyone who can do the yt tutorial video!</p>
                        <a href="https://forms.gle/3jY4UEEc5tBVBVWm7" target="_blank">
                            <i class="nf nf-fa-external_link"></i> help us out
                        </a>
                    </div>
                `;
            });
    }

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const fls = e.dataTransfer.files;
        if (fls.length > 0) {
            fileIn.files = fls;
            fileIn.dispatchEvent(new Event('change'));
        }
    });

    fileIn.addEventListener('change', function(e) {
        const fls = Array.from(e.target.files);
        
        if (fls.length > 99) {
            alert('max 99 pics bro');
            fileIn.value = '';
            return;
        }
        
        if (fls.length > 5) {
            rslt.className = 'result warning';
            rslt.innerHTML = '<p>⚠️ yo thats a lot of pics, might take a sec...</p>';
        }

        procsdImgs = [];
        imgPrev.innerHTML = '';
        prevBox.style.display = 'none';
        allFiles = fls;
        currCropIdx = 0;
        savedCrop = null;
        
        procNextImg();
    });

    function procNextImg() {
        if (currCropIdx >= allFiles.length) {
            dispAllPrevs();
            return;
        }

        const fl = allFiles[currCropIdx];
        const rdr = new FileReader();
        
        rdr.onload = function(evt) {
            const im = new Image();
            im.onload = function() {
                if (im.width < 108 || im.height < 108) {
                    rslt.className = 'result warning';
                    rslt.innerHTML = `<p>⚠️ pic ${currCropIdx + 1} is ${im.width}x${im.height}px, quality gonna be shit lol</p>`;
                }

                if (im.width !== im.height) {
                    showCropMdl(im, evt.target.result);
                } else {
                    procsdImgs.push({
                        data: evt.target.result,
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

    function dispAllPrevs() {
        imgPrev.innerHTML = '';
        procsdImgs.forEach((im, idx) => {
            const prvItem = document.createElement('div');
            prvItem.className = 'preview-item';
            prvItem.innerHTML = `
                <img src="${im.data}" alt="Icon ${idx + 1}">
                <div class="remove-image" data-index="${idx}">×</div>
                <input type="number" class="icon-number" data-index="${idx}" value="${idx + 1}" min="1" max="99" placeholder="#">
            `;
            imgPrev.appendChild(prvItem);
        });

        document.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                procsdImgs.splice(idx, 1);
                dispAllPrevs();
                
                if (procsdImgs.length === 0) {
                    fileIn.value = '';
                    prevBox.style.display = 'none';
                }
            });
        });

        document.querySelectorAll('.icon-number').forEach(inp => {
            inp.addEventListener('change', function() {
                const idx = parseInt(this.dataset.index);
                let val = parseInt(this.value);
                if (val < 1) val = 1;
                if (val > 99) val = 99;
                this.value = val;
                procsdImgs[idx].customNum = val;
            });
        });
        
        if (procsdImgs.length > 0) {
            genPreview(procsdImgs[0].data);
        }
    }

    async function genPreview(imgData) {
        try {
            const formData = new FormData();
            const blob = await (await fetch(imgData)).blob();
            formData.append('previewOnly', 'true');
            formData.append('iconImages[]', blob, 'preview.png');

            const resp = await fetch('preview.php', {
                method: 'POST',
                body: formData
            });

            const data = await resp.json();
            
            if (data.success) {
                const prvImg = new Image();
                prvImg.onload = function() {
                    prevCanv.width = 119;
                    prevCanv.height = 119;
                    prevCtx.drawImage(prvImg, 31, 2, 119, 119, 0, 0, 119, 119);
                    prevBox.style.display = 'block';
                };
                prvImg.src = 'data:image/png;base64,' + data.preview;
            }
        } catch(err) {
            console.log('preview failed:', err);
        }
    }

    function showCropMdl(im, imgSrc) {
        currImg = im;
        cropProg.textContent = `pic ${currCropIdx + 1} of ${allFiles.length}`;
        
        const maxSz = 600;
        imgScale = 1;
        if (im.width > maxSz || im.height > maxSz) {
            imgScale = maxSz / Math.max(im.width, im.height);
        }
        
        cropCanv.width = im.width * imgScale;
        cropCanv.height = im.height * imgScale;
        
        ctx.drawImage(im, 0, 0, cropCanv.width, cropCanv.height);
        
        if (savedCrop) {
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
        
        drawCropOvrly();
        cropMdl.classList.add('active');
        
        setupCropEvts();
    }

    function drawCropOvrly() {
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
        const evts = {
            mousedown: hndlMseDown,
            mousemove: hndlMseMove,
            mouseup: hndlMseUp
        };
        
        Object.keys(evts).forEach(evt => {
            cropCanv.removeEventListener(evt, evts[evt]);
            cropCanv.addEventListener(evt, evts[evt]);
        });
    }

    function hndlMseDown(e) {
        const rct = cropCanv.getBoundingClientRect();
        const x = e.clientX - rct.left;
        const y = e.clientY - rct.top;
        
        const hndsz = 12;
        const corners = [
            { x: cropRct.x, y: cropRct.y, name: 'tl' },
            { x: cropRct.x + cropRct.size, y: cropRct.y, name: 'tr' },
            { x: cropRct.x, y: cropRct.y + cropRct.size, name: 'bl' },
            { x: cropRct.x + cropRct.size, y: cropRct.y + cropRct.size, name: 'br' }
        ];
        
        for (const c of corners) {
            if (x >= c.x - hndsz && x <= c.x + hndsz && y >= c.y - hndsz && y <= c.y + hndsz) {
                isRsz = true;
                rszCorner = c.name;
                dragStrt = { x, y, origRct: {...cropRct} };
                return;
            }
        }
        
        if (x >= cropRct.x && x <= cropRct.x + cropRct.size &&
            y >= cropRct.y && y <= cropRct.y + cropRct.size) {
            isDrag = true;
            dragStrt = { x: x - cropRct.x, y: y - cropRct.y };
        }
    }

    function hndlMseMove(e) {
        if (!isDrag && !isRsz) return;
        
        const rct = cropCanv.getBoundingClientRect();
        const x = e.clientX - rct.left;
        const y = e.clientY - rct.top;
        
        if (isRsz) {
            const dx = x - dragStrt.x;
            const dy = y - dragStrt.y;
            const orig = dragStrt.origRct;
            
            let newX = orig.x;
            let newY = orig.y;
            let newSz = orig.size;
            
            if (rszCorner === 'br') {
                newSz = Math.min(orig.size + Math.max(dx, dy), cropCanv.width - orig.x, cropCanv.height - orig.y);
            } else if (rszCorner === 'bl') {
                const chng = Math.min(-dx, dy);
                newSz = Math.min(orig.size + chng, cropCanv.width - orig.x, orig.y + orig.size);
                newX = orig.x + orig.size - newSz;
            } else if (rszCorner === 'tr') {
                const chng = Math.min(dx, -dy);
                newSz = Math.min(orig.size + chng, cropCanv.width - orig.x, orig.y + orig.size);
                newY = orig.y + orig.size - newSz;
            } else if (rszCorner === 'tl') {
                const chng = Math.min(-dx, -dy);
                newSz = Math.min(orig.size + chng, orig.x + orig.size, orig.y + orig.size);
                newX = orig.x + orig.size - newSz;
                newY = orig.y + orig.size - newSz;
            }
            
            cropRct = { x: newX, y: newY, size: newSz };
        } else {
            cropRct.x = Math.max(0, Math.min(x - dragStrt.x, cropCanv.width - cropRct.size));
            cropRct.y = Math.max(0, Math.min(y - dragStrt.y, cropCanv.height - cropRct.size));
        }
        
        drawCropOvrly();
    }

    function hndlMseUp() {
        isDrag = false;
        isRsz = false;
        rszCorner = null;
    }

    document.getElementById('resetCrop').addEventListener('click', () => {
        const sz = Math.min(cropCanv.width, cropCanv.height) * 0.8;
        cropRct = {
            x: (cropCanv.width - sz) / 2,
            y: (cropCanv.height - sz) / 2,
            size: sz
        };
        drawCropOvrly();
    });

    document.getElementById('applyCropAll').addEventListener('click', applyCrpAll);

    let savedCrop = null;

    function applyCrpAll() {
        savedCrop = {
            xPct: cropRct.x / cropCanv.width,
            yPct: cropRct.y / cropCanv.height,
            sizePct: cropRct.size / Math.min(cropCanv.width, cropCanv.height)
        };
        
        confirmCrp();
    }

    document.getElementById('confirmCrop').addEventListener('click', confirmCrp);
    
    document.addEventListener('keydown', (e) => {
        if (!cropMdl.classList.contains('active')) return;
        if (e.key === 'Enter') confirmCrp();
        if (e.key === 'Escape') skipCrp();
    });

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
        
        procsdImgs.push({
            data: crpdCanv.toDataURL('image/png'),
            filename: `icon_${currCropIdx + 1}.png`
        });
        
        closeCropMdl();
    }

    document.getElementById('cancelCrop').addEventListener('click', skipCrp);

    function skipCrp() {
        closeCropMdl();
    }

    function closeCropMdl() {
        cropMdl.classList.remove('active');
        currCropIdx++;
        setTimeout(() => procNextImg(), 100);
    }

    frm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (procsdImgs.length === 0) {
            alert('bruh select a pic first');
            return;
        }

        const formData = new FormData();
        
        for (let i = 0; i < procsdImgs.length; i++) {
            const blb = await (await fetch(procsdImgs[i].data)).blob();
            formData.append('iconImages[]', blb, `icon_${i}.png`);
            formData.append('iconNumbers[]', procsdImgs[i].customNum || (i + 1));
        }
        
        if (packIconIn.files[0]) {
            formData.append('customPackIcon', packIconIn.files[0]);
        }
        
        formData.append('noBall', noBallChk.checked ? 'true' : 'false');
        formData.append('ballOnly', ballOnlyChk.checked ? 'true' : 'false');
        
        formData.append('packName', document.getElementById('packName').value);
        formData.append('packAuthor', document.getElementById('packAuthor').value);
        
        submitBt.disabled = true;
        document.querySelector('.btn-text').style.display = 'none';
        document.querySelector('.btn-loading').style.display = 'inline';

        try {
            const resp = await fetch('process.php', {
                method: 'POST',
                body: formData
            });

            const data = await resp.json();

            if (data.success) {
                fetch(`stats.php?action=icon`)
                    .then(r => r.json())
                    .then(d => {
                        if (d.success) updtStts(d.stats);
                    });
                
                const lnk = document.createElement('a');
                lnk.href = data.downloadUrl;
                lnk.download = data.filename;
                document.body.appendChild(lnk);
                lnk.click();
                document.body.removeChild(lnk);
                
                rslt.className = 'result success';
                rslt.innerHTML = `
                    <h3>✓ done!</h3>
                    <p>${data.message}</p>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">
                        <i class="nf nf-fa-download"></i> download started! file gets deleted after.
                    </p>
                `;
                
                setTimeout(() => {
                    showDonateModal();
                }, 500);
            } else {
                rslt.className = 'result error';
                rslt.innerHTML = `
                    <h3>✗ shit broke</h3>
                    <p>${data.message}</p>
                `;
            }
        } catch (err) {
            rslt.className = 'result error';
            rslt.innerHTML = `
                <h3>✗ error</h3>
                <p>something fucked up, try again</p>
            `;
        } finally {
            submitBt.disabled = false;
            document.querySelector('.btn-text').style.display = 'inline';
            document.querySelector('.btn-loading').style.display = 'none';
        }
    });

    function showDonateModal() {
        const modOvr = document.createElement('div');
        modOvr.className = 'modal-overlay';
        
        const mod = document.createElement('div');
        mod.className = 'modal';
        mod.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <i class="nf nf-fa-heart" style="color: #e74c3c; font-size: 48px;"></i>
                    <h2>💝 liking it?</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
                        this tools <strong>100% free</strong> and always will be! 
                        if u found it helpful, consider donating!
                    </p>
                    <div class="modal-buttons">
                        <a href="https://malikhw.github.io/donate" target="_blank" class="modal-btn donate-btn" onclick="window.donateModalClose()">
                            <i class="nf nf-fa-heart"></i> donate ❤️
                        </a>
                        <button type="button" class="modal-btn close-btn" id="closeDonate">
                            <i class="nf nf-fa-times"></i> nah
                        </button>
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 15px;">
                        no pressure! ur download already started 😊
                    </p>
                </div>
            </div>
        `;
        
        modOvr.appendChild(mod);
        document.body.appendChild(modOvr);
        
        setTimeout(() => modOvr.classList.add('active'), 10);
        
        window.donateModalClose = function() {
            closeDonateAndShare();
        };
        
        document.getElementById('closeDonate').addEventListener('click', closeDonateAndShare);
        
        function closeDonateAndShare() {
            modOvr.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modOvr);
                showSharePopup();
            }, 300);
        }
    }

    function showSharePopup() {
        const shareTxt = document.querySelector('meta[name="share-text"]').content;
        
        const shareOvr = document.createElement('div');
        shareOvr.className = 'modal-overlay';
        
        const shareMod = document.createElement('div');
        shareMod.className = 'modal';
        shareMod.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <i class="nf nf-fa-share_alt" style="color: #667eea; font-size: 48px;"></i>
                    <h2>📢 spread the word!</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 15px; color: #666; margin-bottom: 15px;">
                        loved the tool? share it! copy this:
                    </p>
                    <div class="share-text-box">
                        <textarea id="shareTextArea" readonly>${shareTxt}</textarea>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="modal-btn copy-btn" id="copyShareTxt">
                            <i class="nf nf-fa-copy"></i> copy
                        </button>
                        <button type="button" class="modal-btn close-btn" id="closeShare">
                            <i class="nf nf-fa-times"></i> close
                        </button>
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 15px;">
                        post it anywhere! reddit, discord, twitter, wherever 🙏
                    </p>
                </div>
            </div>
        `;
        
        shareOvr.appendChild(shareMod);
        document.body.appendChild(shareOvr);
        
        setTimeout(() => shareOvr.classList.add('active'), 10);
        
        document.getElementById('copyShareTxt').addEventListener('click', function() {
            const txtarea = document.getElementById('shareTextArea');
            txtarea.select();
            document.execCommand('copy');
            
            this.innerHTML = '<i class="nf nf-fa-check"></i> copied!';
            this.style.background = '#28a745';
            
            setTimeout(() => {
                this.innerHTML = '<i class="nf nf-fa-copy"></i> copy';
                this.style.background = '';
            }, 2000);
        });
        
        document.getElementById('closeShare').addEventListener('click', function() {
            shareOvr.classList.remove('active');
            setTimeout(() => document.body.removeChild(shareOvr), 300);
        });
    }
});
