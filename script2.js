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

function setupColorInputs() {
    const p1Picker = document.getElementById('p1ColorPicker');
    const p1Text = document.getElementById('p1Color');
    const p2Picker = document.getElementById('p2ColorPicker');
    const p2Text = document.getElementById('p2Color');
    
    p1Picker.addEventListener('input', () => {
        p1Text.value = p1Picker.value.toUpperCase();
    });
    
    p1Text.addEventListener('input', () => {
        const hex = p1Text.value.trim();
        if(/^#[0-9A-F]{6}$/i.test(hex)) {
            p1Picker.value = hex;
        }
    });
    
    p2Picker.addEventListener('input', () => {
        p2Text.value = p2Picker.value.toUpperCase();
    });
    
    p2Text.addEventListener('input', () => {
        const hex = p2Text.value.trim();
        if(/^#[0-9A-F]{6}$/i.test(hex)) {
            p2Picker.value = hex;
        }
    });
    
    p1Text.value = '#FFFFFF';
    p2Text.value = '#FFFFFF';
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
