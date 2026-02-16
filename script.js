const fkdNames = ['hitler','epstein','stalin','mussolini','mao','pol pot','goebbels','himmler','mengele','bin laden','saddam hussein','idi amin','jeffrey dahmer','ted bundy','charles manson','john wayne gacy','timothy mcveigh','osama','jihadi john','isis','al qaeda','nazi','kkk','putin','kim jong','castro'];

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

// ── Donate Dropdown ──────────────────────────────────────────────────────────
function createDonateDropdown() {
    // Remove existing dropdown if any
    const existing = document.getElementById('donateDropdownOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'donateDropdownOverlay';
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div id="donateDropdownBox" class="modal donate-modal">
            <div class="modal-content">
                <button id="donateDropdownClose" class="modal-close-x" title="close">
                    <i class="nf nf-fa-times"></i>
                </button>
                <div class="modal-header">
                    <i class="nf nf-fa-heart" style="color:#e74c3c; font-size:40px;"></i>
                    <h2>support the dev!</h2>
                    <p class="modal-sub">this tool is 100% free — any support helps a ton</p>
                </div>
                <div class="modal-body">
                    <div class="dd-btn-row">
                        <a class="dd-link-btn" href="https://absolllute.com/store/mega_hack?gift=1" target="_blank" rel="noopener">
                            <i class="nf nf-fa-shopping_cart dd-icon"></i>
                            <span class="dd-label">
                                Buy MHv9
                                <span class="dd-sub">get me Mega Hack v9 as a gift!(it'll be a W)</span>
                            </span>
                            <i class="nf nf-fa-external_link dd-arrow"></i>
                        </a>
                        <a class="dd-link-btn" href="https://throne.com/MalikHw47" target="_blank" rel="noopener">
                            <i class="nf nf-fa-gift dd-icon"></i>
                            <span class="dd-label">
                                Get me a gift!
                                <span class="dd-sub">Gift me anything else from Throne</span>
                            </span>
                            <i class="nf nf-fa-external_link dd-arrow"></i>
                        </a>
                        <a class="dd-link-btn" href="https://discord.gg/G9bZ92eg2n" target="_blank" rel="noopener">
                            <i class="nf nf-fa-discord dd-icon"></i>
                            <span class="dd-label">
                                Boost our Discord server
                                <span class="dd-sub">join &amp; boost my discord community</span>
                            </span>
                            <i class="nf nf-fa-external_link dd-arrow"></i>
                        </a>
                    </div>
                    <div class="dd-kofi-wrap" id="kofiWidgetZone">
                        <!-- Ko-fi widget injected here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDonateDropdown();
    });
    document.getElementById('donateDropdownClose').addEventListener('click', closeDonateDropdown);

    // Ko-fi: reuse if already loaded, inject once otherwise
    const kofiZone = document.getElementById('kofiWidgetZone');
    if (typeof kofiwidget2 !== 'undefined') {
        kofiwidget2.init('Sponsor', '#525252', 'G2G310RTCB');
        kofiZone.innerHTML = kofiwidget2.getHTML();
    } else {
        const kofiScript = document.createElement('script');
        kofiScript.type = 'text/javascript';
        kofiScript.src = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js';
        kofiScript.onload = function() {
            if (typeof kofiwidget2 !== 'undefined') {
                kofiwidget2.init('Sponsor', '#525252', 'G2G310RTCB');
                kofiZone.innerHTML = kofiwidget2.getHTML();
            }
        };
        document.head.appendChild(kofiScript);
    }

    const escHandler = (e) => {
        if (e.key === 'Escape') { closeDonateDropdown(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
}

function closeDonateDropdown() {
    const overlay = document.getElementById('donateDropdownOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

function interceptDonateLinks() {
    // Intercept all donate anchor links and the footer donate link
    document.querySelectorAll('a.donate-link, a[href*="malikhw.github.io/donate"]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            createDonateDropdown();
        });
    });
}
// ─────────────────────────────────────────────────────────────────────────────

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
    const nameIn = document.getElementById('packName');
    const packIconIn = document.getElementById('packIcon');
    const packIconPrev = document.getElementById('packIconPreview');
    const packIconImg = document.getElementById('packIconImg');

    const mnth = parseInt(document.body.dataset.month);
    const dy = parseInt(document.body.dataset.day);

    if(mnth === 8 && dy === 31) {
        doMikuBday();
    }
    if(mnth === 1 && dy === 20) {
        doEpsteinShit();
    }

    setupGamemodeChks();
    checkIfMobile();
    checkZipLimit();
    loadIconReq();
    interceptDonateLinks();

    const savedAuth = localStorage.getItem('gdIconAuthor');
    if(savedAuth) {
        authIn.value = savedAuth;
    }

    authIn.addEventListener('change', function() {
        localStorage.setItem('gdIconAuthor', this.value);
    });

    nameIn.addEventListener('blur', checkControversial);
    authIn.addEventListener('blur', checkControversial);

    packIconIn.addEventListener('change', function(e) {
        const fl = e.target.files[0];
        if(!fl) return;
        if(fl.size > 5*1024*1024) {
            alert('pack icon too thicc bro, max 5MB');
            this.value = '';
            return;
        }
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

    document.getElementById('tutorialToggle').addEventListener('click', function() {
        this.classList.toggle('active');
        document.getElementById('tutorialContent').classList.toggle('active');
    });

    loadStts();
    loadYT();
    
    fetch('stats.php?action=visit')
        .then(r => r.json())
        .then(d => {
            if(d.success) updtStts(d.stats);
        })
        .catch(e => console.log('stats err:', e));

    function loadStts() {
        fetch('stats.php?action=get')
            .then(r => r.json())
            .then(d => {
                if(d.success) updtStts(d.stats);
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
                if(d.visible && d.videoId) {
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

    function loadIconReq() {
        fetch('icon.php')
            .then(r => r.json())
            .then(d => {
                if(d.visible && d.url) {
                    document.getElementById('iconRequestCard').style.display = 'block';
                    document.getElementById('iconRequestBtn').href = d.url;
                }
            })
            .catch(e => console.log('icon req err:', e));
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
        if(fls.length > 0) {
            fileIn.files = fls;
            fileIn.dispatchEvent(new Event('change'));
        }
    });

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
            rslt.className = 'result warning';
            rslt.innerHTML = '<p>⚠️ yo thats a lot of pics, might take a sec...</p>';
        }

        procsdImgs = [];
        imgPrev.innerHTML = '';
        prevBox.style.display = 'none';
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
                    rslt.className = 'result warning';
                    rslt.innerHTML = `<p>⚠️ pic ${currCropIdx + 1} is ${im.width}x${im.height}px, quality gonna be shit lol</p>`;
                }

                if(im.width !== im.height) {
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
                    fileIn.value = '';
                    prevBox.style.display = 'none';
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
        
        if(procsdImgs.length > 0) {
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
            
            if(data.success) {
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
        const rct = cropCanv.getBoundingClientRect();
        const x = e.clientX - rct.left;
        const y = e.clientY - rct.top;
        startCropInteract(x, y);
    }

    function hndlTchStart(e) {
        e.preventDefault();
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
        const rct = cropCanv.getBoundingClientRect();
        const x = e.clientX - rct.left;
        const y = e.clientY - rct.top;
        moveCropInteract(x, y);
    }

    function hndlTchMove(e) {
        e.preventDefault();
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
                newSz = Math.min(orig.size + Math.max(dx, dy), cropCanv.width - orig.x, cropCanv.height - orig.y);
            } else if(rszCorner === 'bl') {
                const chng = Math.min(-dx, dy);
                newSz = Math.min(orig.size + chng, cropCanv.width - orig.x, orig.y + orig.size);
                newX = orig.x + orig.size - newSz;
            } else if(rszCorner === 'tr') {
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

    document.getElementById('resetCrop').addEventListener('click', () => {
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
        if(!cropMdl.classList.contains('active')) return;
        if(e.key === 'Enter') confirmCrp();
        if(e.key === 'Escape') skipCrp();
        if(e.key === 'r' || e.key === 'R') document.getElementById('resetCrop').click();
        if(e.key === 'a' || e.key === 'A') applyCrpAll();
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

        if(procsdImgs.length === 0) {
            alert('bruh select a pic first');
            return;
        }

        const lmt = checkZipLimit();
        if(!lmt.ok) {
            alert(`yo u hit the limit bro, ${lmt.remaining} zips left today (resets in ${lmt.hoursLeft}h)`);
            return;
        }

        if(mnth === 4 && dy === 1) {
            showFakePremium();
            return;
        }

        const formData = new FormData();
        
        for(let i = 0; i < procsdImgs.length; i++) {
            const blb = await (await fetch(procsdImgs[i].data)).blob();
            formData.append('iconImages[]', blb, procsdImgs[i].filename);
            formData.append('iconNumbers[]', procsdImgs[i].customNum || (i + 1));
            formData.append('gifFlags[]', 'false');
            formData.append('gifFps[]', '30');
        }
        
        if(packIconIn.files[0]) {
            formData.append('customPackIcon', packIconIn.files[0]);
        }
        
        formData.append('doCube', document.getElementById('doCube').checked ? 'true' : 'false');
        formData.append('doWave', document.getElementById('doWave').checked ? 'true' : 'false');
        formData.append('doBall', document.getElementById('doBall').checked ? 'true' : 'false');
        
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

            const contentType = resp.headers.get('content-type');
            
            if(contentType && contentType.includes('application/json')) {
                const data = await resp.json();
                if(data.success) {
                    incrZipCount();
                    
                    fetch(`stats.php?action=icon`)
                        .then(r => r.json())
                        .then(d => {
                            if(d.success) updtStts(d.stats);
                        });
                    
                    window.location.href = data.downloadUrl;
                    
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
            } else {
                incrZipCount();
                
                fetch(`stats.php?action=icon`)
                    .then(r => r.json())
                    .then(d => {
                        if(d.success) updtStts(d.stats);
                    });
                
                const blob = await resp.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = document.getElementById('packName').value.replace(/[^a-zA-Z0-9_-]/g, '_') + '.zip';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                rslt.className = 'result success';
                rslt.innerHTML = `
                    <h3>✓ done!</h3>
                    <p>Icon pack created successfully with ${procsdImgs.length} icon(s)!</p>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">
                        <i class="nf nf-fa-download"></i> download started! file gets deleted after.
                    </p>
                `;
                
                setTimeout(() => {
                    showDonateModal();
                }, 500);
            }
        } catch(err) {
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

    function checkControversial() {
        const txt = (nameIn.value + ' ' + authIn.value).toLowerCase();
        for(let nm of fkdNames) {
            if(txt.includes(nm)) {
                showControversialPopup();
                break;
            }
        }
    }

    function showControversialPopup() {
        const modOvr = document.createElement('div');
        modOvr.className = 'modal-overlay';
        
        const mod = document.createElement('div');
        mod.className = 'modal';
        mod.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="font-size:48px;">😳</h2>
                    <h2>im sorry WHAT?</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 16px; color: #666;">
                        bruh... really? aight im still gonna process it but damn
                    </p>
                    <button type="button" class="modal-btn close-btn" id="closeControversial">
                        <i class="nf nf-fa-times"></i> my bad
                    </button>
                </div>
            </div>
        `;
        
        modOvr.appendChild(mod);
        document.body.appendChild(modOvr);
        
        setTimeout(() => modOvr.classList.add('active'), 10);
        
        document.getElementById('closeControversial').addEventListener('click', () => {
            modOvr.classList.remove('active');
            setTimeout(() => document.body.removeChild(modOvr), 300);
        });
    }

    function checkZipLimit() {
        const todayKey = new Date().toDateString();
        let zipData = localStorage.getItem('zipLimitData');
        
        if(zipData) {
            zipData = JSON.parse(zipData);
            if(zipData.date !== todayKey) {
                zipData = {date: todayKey, count: 0};
                localStorage.setItem('zipLimitData', JSON.stringify(zipData));
            }
        } else {
            zipData = {date: todayKey, count: 0};
            localStorage.setItem('zipLimitData', JSON.stringify(zipData));
        }

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        const msLeft = tomorrow - now;
        const hrsLeft = Math.ceil(msLeft / (1000 * 60 * 60));

        return {
            ok: zipData.count < 10,
            remaining: 10 - zipData.count,
            hoursLeft: hrsLeft
        };
    }

    function incrZipCount() {
        const todayKey = new Date().toDateString();
        let zipData = JSON.parse(localStorage.getItem('zipLimitData') || '{"date":"","count":0}');
        
        if(zipData.date !== todayKey) {
            zipData = {date: todayKey, count: 1};
        } else {
            zipData.count++;
        }
        
        localStorage.setItem('zipLimitData', JSON.stringify(zipData));
    }

    function checkIfMobile() {
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            document.body.classList.add('is-mobile');
        }
    }

    function doMikuBday() {
        confetti({
            particleCount: 200,
            spread: 160,
            origin: {y: 0.6},
            colors: ['#39c5bb', '#5eaee5', '#91d8f7']
        });
        
        const bnr = document.createElement('div');
        bnr.className = 'miku-banner';
        bnr.innerHTML = '<h1>🎉 HAPPY BDAY MIKU! 🎂</h1>';
        document.body.appendChild(bnr);
        
        setTimeout(() => {
            confetti({
                particleCount: 150,
                spread: 120,
                origin: {y: 0.7},
                colors: ['#39c5bb', '#5eaee5', '#91d8f7']
            });
        }, 1000);
    }

    function doEpsteinShit() {
        setInterval(() => {
            redactText();
            setTimeout(() => unredactText(), 5000);
        }, 10000);
    }

    function redactText() {
        const allTxt = document.querySelectorAll('p, li, span, h1, h2, h3, label, button, a');
        allTxt.forEach(el => {
            if(el.classList.contains('redacted')) return;
            const txt = el.textContent;
            if(txt.length > 5) {
                const half = Math.floor(txt.length / 2);
                const redactStart = Math.floor(Math.random() * half);
                const redactLen = Math.floor(Math.random() * half) + 1;
                
                el.dataset.origText = txt;
                const before = txt.substring(0, redactStart);
                const redact = '█'.repeat(redactLen);
                const after = txt.substring(redactStart + redactLen);
                el.textContent = before + redact + after;
                el.classList.add('redacted');
            }
        });
    }

    function unredactText() {
        const redacted = document.querySelectorAll('.redacted');
        redacted.forEach(el => {
            if(el.dataset.origText) {
                el.textContent = el.dataset.origText;
            }
            el.classList.remove('redacted');
        });
    }

    function showFakePremium() {
        const modOvr = document.createElement('div');
        modOvr.className = 'modal-overlay';
        
        const mod = document.createElement('div');
        mod.className = 'modal premium-modal';
        mod.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="background: linear-gradient(135deg, #ffd700, #ffed4e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px;">
                        ✨ UPGRADE TO PREMIUM ✨
                    </h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">
                        Unlock these AMAZING features:
                    </p>
                    <ul style="text-align: left; margin: 20px auto; max-width: 400px; font-size: 14px; line-height: 2;">
                        <li>❌ 1 icon per pack max</li>
                        <li>❌ Watermark on every icon</li>
                        <li>❌ 480p quality only</li>
                        <li>❌ 24 hour processing time</li>
                        <li>❌ Random icon rotation bug</li>
                        <li>❌ Ads every 10 seconds</li>
                        <li>❌ Your data sold to advertisers</li>
                        <li>❌ Captcha before every download</li>
                    </ul>
                    <p style="font-size: 24px; font-weight: 700; color: #e74c3c; margin: 20px 0;">
                        Only $99.99/month!
                    </p>
                    <button type="button" class="modal-btn donate-btn" style="font-size: 20px; padding: 20px;">
                        💳 UPGRADE NOW
                    </button>
                    <p style="font-size: 10px; color: #999; margin-top: 20px;">
                        *auto-renews forever, cant cancel, we keep charging even after u die
                    </p>
                </div>
            </div>
        `;
        
        modOvr.appendChild(mod);
        document.body.appendChild(modOvr);
        
        setTimeout(() => modOvr.classList.add('active'), 10);
        
        mod.querySelector('.modal-btn').addEventListener('click', () => {
            mod.querySelector('.modal-body').innerHTML = `
                <h2 style="font-size: 48px; margin: 40px 0;">😂</h2>
                <h3 style="font-size: 24px;">jk bro</h3>
                <p style="font-size: 16px; color: #666; margin: 20px 0;">
                    this shits free forever lmao
                </p>
                <button type="button" class="modal-btn close-btn" id="closeAprilFools">
                    <i class="nf nf-fa-times"></i> aight cool
                </button>
            `;
            
            document.getElementById('closeAprilFools').addEventListener('click', () => {
                modOvr.classList.remove('active');
                setTimeout(() => document.body.removeChild(modOvr), 300);
                frm.dispatchEvent(new Event('submit'));
            });
        });
    }

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
                        <button type="button" class="modal-btn donate-btn" id="openDonateFromModal">
                            <i class="nf nf-fa-heart"></i> donate ❤️
                        </button>
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

        document.getElementById('openDonateFromModal').addEventListener('click', () => {
            modOvr.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modOvr);
                createDonateDropdown();
            }, 200);
        });
        
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
