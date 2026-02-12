function setupGamemodeChks() {
    const cubeChk = document.getElementById('doCube');
    const waveChk = document.getElementById('doWave');
    const ballChk = document.getElementById('doBall');
    
    function checkAtLeastOne() {
        if(!cubeChk.checked && !waveChk.checked && !ballChk.checked) {
            cubeChk.checked = true;
        }
    }
    
    cubeChk.addEventListener('change', checkAtLeastOne);
    waveChk.addEventListener('change', checkAtLeastOne);
    ballChk.addEventListener('change', checkAtLeastOne);
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
