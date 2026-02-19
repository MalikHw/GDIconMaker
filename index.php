<?php
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$dt = new DateTime('now', new DateTimeZone('UTC'));
$mnth = (int)$dt->format('n');
$dy = (int)$dt->format('j');
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GD Custom Icons Maker - Create Geometry Dash Icon from a picture</title>
    <meta name="description" content="Free online tool to create custom Geometry Dash icons from a picture!. Upload your image and generate HD/UHD icon packs instantly!">
    <meta name="keywords" content="geometry dash, gd icons, custom icons, icon pack maker, gd pack creator, geometry dash customization">
    <meta name="author" content="MalikHw47">
    <meta property="og:title" content="GD Custom Icons Maker">
    <meta property="og:description" content="Create custom Geometry Dash icons from a pic!!">
    <meta property="og:type" content="website">
    <meta property="og:image" content="pack.png">
    <meta name="share-text" content="Yo check out this free tool to make custom GD icons from any pic! No tutorials needed, just upload and download. Supports up to 99 images! gdiconmaker.rf.gd">
    <meta name="color-scheme" content="light dark">
    <link rel="icon" type="image/png" href="pack.png">
    <link rel="stylesheet" href="style.css?v=<?php echo filemtime('style.css'); ?>">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script src="https://www.hCaptcha.com/1/api.js" async defer></script>
</head>
<body data-month="<?php echo $mnth; ?>" data-day="<?php echo $dy; ?>">
    <div class="stats-outside">
        <div class="stat-box">
            <i class="nf nf-fa-eye"></i>
            <span id="totalVisits">...</span>
            <small>visits</small>
        </div>
        <div class="stat-box">
            <i class="nf nf-fa-image"></i>
            <span id="totalIcons">...</span>
            <small>made</small>
        </div>
    </div>

    <div class="main-layout">
        <div class="youtube-container">
            <h3><i class="nf nf-fa-youtube_play"></i> Tutorial</h3>
            <div id="youtubeEmbed"></div>
        </div>

        <div class="main-container">
            <h1><img src="head.png" alt="GD Custom Icons Maker" class="logo"></h1>
            <p class="subtitle">(make ur custom gd icon pack)</p>
            
            <div class="tutorial-dropdown">
                <button type="button" class="tutorial-toggle" id="tutorialToggle">
                    <i class="nf nf-fa-question_circle"></i> HOW TO INSTALL
                    <i class="nf nf-fa-chevron_down tutorial-arrow"></i>
                </button>
                <div class="tutorial-content" id="tutorialContent">
                    <div class="tutorial-section">
                        <h3><i class="nf nf-fa-image"></i> How to get the custom pic</h3>
                        <ol>
                            <li>Put your picture here</li>
                            <li>Add the metadata</li>
                            <li>Click on the <strong>Generate Icon Pack</strong> button</li>
                            <li>When you get the ZIP file:</li>
                        </ol>
                    </div>

                    <div class="tutorial-section">
                        <h3><i class="nf nf-fa-wrench"></i> Do the following:</h3>
                        <ol>
                            <li>Open GD</li>
                            <li>Make sure you have <strong>Geode</strong> (if on 2.2081 then wait till it releases)</li>
                            <li>Install the <strong>Texture Loader</strong> and <strong>More Icons</strong> mods from the index</li>
                            <li>Restart</li>
                            <li>Open <code>Settings > Graphics > Textures</code></li>
                            <li>Drag-n-drop the TP to the right (just like Minecraft)</li>
                            <li>Click apply</li>
                            <li>Go to your icon set</li>
                            <li><strong>THAT'S IT!(no need to change player colors as in 15/feb/2026 update</li>
                        </ol>
                    </div>

                    <div class="tutorial-section alternate">
                        <h3><i class="nf nf-fa-clock_o"></i> You hate waiting for Geode:</h3>
                        <ol>
                            <li>Go to your Geometry Dash folder (usually at <code>C:\Program Files (x86)\Steam\steamapps\common\Geometry Dash\</code>)</li>
                            <li>Go to the <code>resources</code> folder</li>
                            <li>Open the ZIP you downloaded earlier and copy the whole <strong>ICONS</strong> folder there!</li>
                            <li><em>(if you want your old icon back then do an integrity check on the game)</em></li>
                        </ol>
                    </div>
                </div>
            </div>

            <div class="shortcuts-help">
                <span class="shortcuts-icon" title="Keyboard Shortcuts">?</span>
                <div class="shortcuts-tooltip">
                    <strong>Keyboard Shortcuts:</strong>
                    <ul>
                        <li><kbd>Enter</kbd> - Confirm crop</li>
                        <li><kbd>Esc</kbd> - Skip/Cancel</li>
                        <li><kbd>R</kbd> - Reset crop</li>
                        <li><kbd>A</kbd> - Apply to all</li>
                    </ul>
                </div>
            </div>
            
            <form id="iconForm" enctype="multipart/form-data">
                <div class="upload-section">
                    <div class="upload-label" id="dropZone">
                        <span class="upload-icon"><i class="nf nf-fa-folder_open"></i></span>
                        <span>drop ur pics here or click (max 400 pics, 5MB each)</span>
                        <input type="file" id="iconImage" name="iconImage[]" accept="image/*,image/gif" multiple required>
                    </div>
                    
                    <div id="previewBox" class="preview-box" style="display:none;">
                        <p>preview of icon:</p>
                        <canvas id="previewCanvas"></canvas>
                        <p class="preview-note">this is how itll look in-game (cropped view)</p>
                    </div>
                    
                    <div id="imagePreview" class="image-preview"></div>
                </div>

                <div class="form-group">
                    <label for="packIcon"><i class="nf nf-fa-image"></i> custom pack icon (optional):</label>
                    <div class="pack-icon-upload">
                        <input type="file" id="packIcon" name="packIcon" accept="image/*">
                        <label for="packIcon" class="pack-icon-label">
                            <i class="nf nf-fa-upload"></i> upload pack.png
                        </label>
                        <div id="packIconPreview" style="display:none;">
                            <img id="packIconImg" src="" alt="Pack Icon">
                            <button type="button" id="removePackIcon" class="remove-pack-icon">×</button>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label><i class="nf nf-fa-gamepad"></i> gamemodes:</label>
                    <div class="ball-options">
                        <label class="ball-checkbox">
                            <input type="checkbox" id="doCube" name="doCube" checked>
                            <span>cube</span>
                        </label>
                        <label class="ball-checkbox">
                            <input type="checkbox" id="doWave" name="doWave" checked>
                            <span>wave</span>
                        </label>
                        <label class="ball-checkbox">
                            <input type="checkbox" id="doBall" name="doBall" checked>
                            <span>ball</span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label for="packName"><i class="nf nf-fa-tag"></i> pack name:</label>
                    <input type="text" id="packName" name="packName" placeholder="my sick pack" required>
                </div>

                <div class="form-group">
                    <label for="packAuthor"><i class="nf nf-fa-user"></i> author:</label>
                    <input type="text" id="packAuthor" name="packAuthor" placeholder="ur name" required>
                </div>

                <div class="form-group">
                    <div class="h-captcha" data-sitekey="89f2ecae-ae84-4fd2-bbb0-a80edfe63b90"></div>
                </div>

                <button type="submit" id="submitBtn" class="submit-btn">
                    <span class="btn-text"><i class="nf nf-fa-magic"></i> generate pack</span>
                    <span class="btn-loading" style="display:none;">
                        <i class="nf nf-fa-circle_o_notch nf-spin"></i> okay, it's cookin'...
                    </span>
                </button>
            </form>

            <div id="result" class="result"></div>

            <div id="iconRequestCard" class="icon-request-card" style="display:none;">
                <div class="icon-request-content">
                    <i class="nf nf-fa-picture_o" style="font-size: 48px; color: var(--accent);"></i>
                    <h3>I need a website icon</h3>
                    <p>got a cool idea for an icon for this site? You can help!(yes cuz current sucks ass)</p>
                    <a href="#" id="iconRequestBtn" target="_blank" class="icon-request-btn">
                        <i class="nf nf-fa-external_link"></i> request icon
                    </a>
                </div>
            </div>

            <footer class="footer">
                <p>made with <i class="nf nf-fa-heart" style="color:#e74c3c;"></i> and shit by <strong>MalikHw47</strong></p>
                <div class="social-links">
                    <a href="https://discord.gg/G9bZ92eg2n" target="_blank" title="Discord"><i class="nf nf-fa-discord"></i></a>
                    <a href="https://youtube.com/@MalikHw47" target="_blank" title="YouTube"><i class="nf nf-fa-youtube_play"></i></a>
                    <a href="https://twitch.tv/MalikHw47" target="_blank" title="Twitch"><i class="nf nf-fa-twitch"></i></a>
                    <a href="https://github.com/MalikHw" target="_blank" title="GitHub"><i class="nf nf-fa-github"></i></a>
                    <a href="https://malikhw.github.io" target="_blank" title="Website"><i class="nf nf-fa-globe"></i></a>
                    <a href="mailto:help.malicorporation@gmail.com" title="Email"><i class="nf nf-fa-envelope"></i></a>
                    <a href="https://malikhw.github.io/donate" target="_blank" title="Donate" class="donate-link"><i class="nf nf-fa-heart"></i> donate</a>
                </div>
                <div class="footer-links">
                    <a href="https://github.com/MalikHw/GDIconMaker" target="_blank" class="source-link">
                        <i class="nf nf-fa-code"></i> src code
                    </a>
                    <a href="https://github.com/MalikHw/GDIconMaker/issues" target="_blank" class="bug-link">
                        <i class="nf nf-fa-bug"></i> report bug
                    </a>
                    <a href="https://forms.gle/1gLzxU36EePVKPaB6" target="_blank" class="feature-link">
                        <i class="nf nf-fa-lightbulb_o"></i> request feature
                    </a>
                    <a href="privacy.html" class="privacy-link">
                        <i class="nf nf-fa-lock"></i> privacy
                    </a>
                </div>
                <p style="font-size: 12px; color: var(--text-light); margin-top: 15px;">
                    licensed under <a href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank" style="color: var(--accent);">MPL 2.0</a>
                </p>
            </footer>
        </div>

        <div class="changelog-container">
            <h3><i class="nf nf-fa-history"></i> Changelog</h3>
            <iframe id="changelogFrame" src="changelog.html?v=<?php echo filemtime('changelog.html'); ?>"></iframe>
        </div>
    </div>

    <div class="crop-modal" id="cropModal">
        <div class="crop-modal-content">
            <div class="crop-header">
                <h3><i class="nf nf-fa-crop"></i> crop ur pic</h3>
                <div class="crop-progress" id="cropProgress"></div>
            </div>
            <div class="crop-container">
                <div class="crop-canvas-wrapper">
                    <canvas id="cropCanvas"></canvas>
                    <div class="crop-tip">
                        <strong>tip:</strong> drag to move, resize from corners, or press enter to confirm
                    </div>
                </div>
            </div>
            <div class="crop-controls">
                <button type="button" id="undoCrop" class="crop-btn undo" disabled>
                    <i class="nf nf-fa-undo"></i> undo
                </button>
                <button type="button" id="redoCrop" class="crop-btn redo" disabled>
                    <i class="nf nf-fa-repeat"></i> redo
                </button>
                <button type="button" id="applyCropAll" class="crop-btn accent">
                    <i class="nf nf-fa-copy"></i> apply to all
                </button>
                <button type="button" id="resetCrop" class="crop-btn reset">
                    <i class="nf nf-fa-refresh"></i> reset
                </button>
                <button type="button" id="confirmCrop" class="crop-btn primary">
                    <i class="nf nf-fa-check"></i> done
                </button>
                <button type="button" id="cancelCrop" class="crop-btn secondary">
                    <i class="nf nf-fa-times"></i> skip
                </button>
            </div>
        </div>
    </div>

    <script src="script2.js?v=<?php echo time(); ?>"></script>
    <script src="script.js?v=<?php echo filemtime('script.js'); ?>"></script>
</body>
</html>
