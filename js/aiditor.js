
// Visual Admin Editor & AI Inspector Script (Portable + Backend)
const initEditor = () => {
    // 0. Inject Styles
    const editorStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        /* --- Admin Editor Toolbar (Dark Steel) --- */
        #admin-editor-toolbar {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(145deg, #2b2b2b, #1a1a1a);
            border: 1px solid #444;
            border-top: 1px solid #555;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 16px;
            z-index: 9999;
            width: 260px;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            color: #e0e0e0;
            backdrop-filter: blur(5px);
        }

        #admin-editor-toolbar .editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            border-bottom: 1px solid #333;
            padding-bottom: 8px;
        }

        #admin-editor-toolbar .editor-title {
            font-weight: 600;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 11px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .editor-btn {
            background: linear-gradient(to bottom, #4a4a4a, #333);
            border: 1px solid #222;
            border-top: 1px solid #555;
            color: #ccc;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.2s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            height: 38px;
        }

        .editor-btn:hover {
            background: linear-gradient(to bottom, #555, #3d3d3d);
            color: #fff;
            transform: translateY(-1px);
        }

        .editor-btn.active {
            background: linear-gradient(to bottom, #0055a5, #003366);
            border-color: #002244;
            color: #fff;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
        }

        .hidden {
            display: none !important;
        }

        .control-group {
            margin-bottom: 15px;
        }

        .control-group label {
            display: block;
            margin-bottom: 6px;
            font-size: 11px;
            color: #aaa;
            text-transform: uppercase;
        }

        .control-group input[type='color'] {
            width: 100%;
            height: 32px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background: none;
        }

        .btn-save {
            width: 100%;
            background: linear-gradient(to bottom, #2ecc71, #27ae60);
            color: #fff;
            border: 1px solid #219150;
            padding: 10px;
            margin-top: 0px;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
            font-size: 12px;
        }

        .btn-save:hover {
            background: linear-gradient(to bottom, #35d57b, #2ecc71);
            box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
        }

        /* Edit Mode Highlights */
        .admin-editing-active [contenteditable='true'] {
            outline: 2px dashed rgba(0, 150, 255, 0.5);
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .admin-editing-active [contenteditable='true']:hover,
        .admin-editing-active [contenteditable='true']:focus {
            outline: 2px solid #0096ff;
            background: rgba(0, 150, 255, 0.05);
            box-shadow: 0 0 15px rgba(0, 150, 255, 0.2);
        }

        /* --- AI Inspector Styles --- */
        .ai-highlighter {
            position: absolute;
            border: 2px solid #00d2ff;
            background-color: rgba(0, 210, 255, 0.1);
            pointer-events: none;
            z-index: 9990;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 20px rgba(0, 210, 255, 0.3);
            border-radius: 4px;
        }

        .ai-action-btn {
            position: absolute;
            background: linear-gradient(135deg, #00d2ff, #3a7bd5);
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 30px;
            font-weight: 600;
            cursor: pointer;
            z-index: 9995;
            box-shadow: 0 5px 20px rgba(0, 150, 255, 0.4);
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.2s;
        }

        .ai-action-btn:hover {
            transform: scale(1.05) translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 150, 255, 0.5);
        }

        /* AI Modal (Brushed Aluminum) */
        .ai-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .ai-modal-content {
            background: linear-gradient(145deg, #ffffff, #f0f0f0);
            padding: 0;
            border-radius: 16px;
            width: 90%;
            max-width: 520px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,1);
            font-family: 'Inter', sans-serif;
            overflow: hidden;
            border: 1px solid #ccc;
        }
        
        .ai-modal-header {
            background: linear-gradient(to bottom, #fff, #f4f4f4);
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
        }

        .ai-modal-content h3 {
            margin: 0;
            color: #1a1a1a;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .ai-modal-content h3::before {
            content: '✨';
            font-size: 20px;
        }

        .ai-modal-body {
            padding: 24px;
            background: #fbfbfb;
        }

        .ai-modal-content p {
            margin-top: 0;
            color: #666;
            font-size: 14px;
            margin-bottom: 15px;
        }

        .ai-modal-content textarea {
            width: 100%;
            height: 120px;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #d1d1d1;
            border-radius: 8px;
            font-family: inherit;
            resize: vertical;
            background: #fff;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
            font-size: 14px;
            line-height: 1.5;
            transition: border-color 0.2s;
        }
        
        .ai-modal-content textarea:focus {
            outline: none;
            border-color: #00d2ff;
            box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.1);
        }

        .ai-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            background: #f4f4f4; /* Subtle footer background */
            padding: 15px 24px;
            border-radius: 0 0 16px 16px;
        }

        .ai-modal-actions button {
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 13px;
            padding: 0 16px; /* Reset vertical padding, rely on flex centering */
            height: 38px; /* Fixed height for consistency */
            min-width: 120px; 
            box-sizing: border-box; /* Include border in height */
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-shadow: 0 1px 1px rgba(0,0,0,0.1);
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* Metallic Silver/Grey Cancel Button (Gunmetal) */
        #ai-cancel-btn {
            background: linear-gradient(to bottom, #6e6e6e, #555555);
            border: 1px solid #444; /* Uniform border */
            color: #ffffff; /* White text to match Send button */
            /* Top highlight and shadow to match Send button intensity */
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.1);
            text-shadow: 0 1px 1px rgba(0,0,0,0.3);
        }

        #ai-cancel-btn:hover {
            background: linear-gradient(to bottom, #7d7d7d, #636363);
            border-color: #555;
            color: #ffffff;
            transform: translateY(-1px);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Metallic Blue Send Button */
        #ai-generate-btn {
            background: linear-gradient(to bottom, #007aff, #0056b3);
            border: 1px solid #004494; /* Uniform border */
            color: #ffffff;
            /* Top highlight via shadow */
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 5px rgba(0, 86, 179, 0.3);
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }

        #ai-generate-btn:hover {
            background: linear-gradient(to bottom, #1a8bff, #0062cc);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(0, 86, 179, 0.4);
            transform: translateY(-1px);
        }
        
        #ai-generate-btn:active {
            transform: translateY(0);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .ai-mode-active {
            cursor: crosshair !important;
        }

        .toolbar-actions {
            display: flex;
            gap: 8px;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.id = "admin-editor-styles";
    styleSheet.innerText = editorStyles;
    document.head.appendChild(styleSheet);


    // 1. Create and Inject Editor Toolbar
    const editorToolbar = document.createElement('div');
    editorToolbar.id = 'admin-editor-toolbar';
    editorToolbar.innerHTML = `
        <div class="editor-header">
            <span class="editor-title">Admin Tools</span>
            <div class="toolbar-actions">
                <button id="toggle-edit-btn" class="editor-btn">Edit Mode</button>
                <button id="toggle-ai-btn" class="editor-btn">AI Mode</button>
            </div>
        </div>
        
        <!-- Manual Edit Controls -->
        <div id="editor-controls" class="hidden">
            <div class="control-group">
                <label>Primary Color</label>
                <input type="color" id="primary-color-picker" value="#003366">
            </div>
            <div class="control-group">
                <label>Secondary Color</label>
                <input type="color" id="secondary-color-picker" value="#D4AF37">
            </div>
            <div class="control-group">
                <button id="save-changes-btn" class="editor-btn btn-save">Download Changes</button>
            </div>
        </div>

        <!-- AI Controls Info -->
        <div id="ai-controls-info" class="hidden">
            <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
                Hover to highlight. Click to select.
            </p>
        </div>
    `;
    document.body.appendChild(editorToolbar);

    // 2. Elements & State
    let isEditing = false;
    let isAIMode = false;
    let selectedElement = null;

    const toggleEditBtn = document.getElementById('toggle-edit-btn');
    const toggleAIBtn = document.getElementById('toggle-ai-btn');
    const controlsPanel = document.getElementById('editor-controls');
    const aiInfoPanel = document.getElementById('ai-controls-info');
    const primaryPicker = document.getElementById('primary-color-picker');
    const secondaryPicker = document.getElementById('secondary-color-picker');
    const saveBtn = document.getElementById('save-changes-btn');

    // Highlighter Element
    const highlighter = document.createElement('div');
    highlighter.className = 'ai-highlighter hidden';
    document.body.appendChild(highlighter);

    const aiActionBtn = document.createElement('button');
    aiActionBtn.className = 'ai-action-btn hidden';
    aiActionBtn.textContent = 'Ask AI Agent';
    document.body.appendChild(aiActionBtn);

    // AI Modal
    const aiModal = document.createElement('div');
    aiModal.className = 'ai-modal hidden';
    aiModal.innerHTML = `
        <div class="ai-modal-content" style="max-width: 500px;">
            <div class="ai-modal-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Ask AI Agent</h3>
                <button id="ai-cancel-btn" class="editor-btn" style="background:none; border:none; font-size:24px; cursor:pointer; color:#666; padding:0; height:auto; width:auto;">&times;</button>
            </div>
            <div class="ai-modal-body">
                <p style="font-size:12px; color:#666; margin-bottom:10px;">
                    Describe what you want to change. The AI will edit the HTML for you.
                </p>
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 12px; font-weight: bold; display: block; margin-bottom: 5px;">Model:</label>
                    <select id="ai-model-select" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="claude-3-5-sonnet-20240620" selected>Claude 3.5 Sonnet (Recommended)</option>
                        <option value="claude-3-opus-20240229">Claude 3 Opus (Most Powerful)</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fastest)</option>
                    </select>
                </div>
                <textarea id="ai-prompt-input" rows="20" placeholder="e.g., Make this text bigger and red..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 15px; font-family: inherit; font-size: 13px; line-height: 1.5; resize: vertical; height: 240px;"></textarea>
                <div class="ai-modal-actions">
                    <button id="ai-generate-btn" class="editor-btn btn-save">Send to Agent</button>
                </div>
                <div id="ai-status-msg" style="margin-top:10px; font-size:12px; color:#666; display:none;">Processing...</div>
            </div>
        </div>
    `;
    document.body.appendChild(aiModal);

    // 3a. Image Editor Modal
    const imgModal = document.createElement('div');
    imgModal.className = 'ai-modal hidden'; // Reuse modal styles
    imgModal.id = 'image-editor-modal';
    imgModal.innerHTML = `
        <div class="ai-modal-content" style="max-width: 400px;">
            <div class="ai-modal-header">
                <h3>Edit Image</h3>
            </div>
            <div class="ai-modal-body">
                <div style="margin-bottom: 15px;">
                    <label style="font-size: 12px; font-weight: bold; display: block; margin-bottom: 5px;">Image Source</label>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <button id="img-tab-url" class="editor-btn active" style="flex:1;">URL</button>
                        <button id="img-tab-upload" class="editor-btn" style="flex:1;">Upload</button>
                    </div>
                    
                    <div id="img-panel-url">
                        <input type="text" id="img-url-input" placeholder="https://example.com/image.jpg" 
                               style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                    
                    <div id="img-panel-upload" class="hidden">
                        <input type="file" id="img-file-input" accept="image/*" 
                               style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <p id="upload-status" style="font-size: 11px; color: #666; margin-top: 5px;"></p>
                    </div>
                </div>
                <div class="ai-modal-actions">
                    <button id="img-cancel-btn" class="editor-btn">Cancel</button>
                    <button id="img-save-btn" class="editor-btn btn-save">Apply</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(imgModal);

    // 3b. Link Editor Modal
    const linkModal = document.createElement('div');
    linkModal.className = 'ai-modal hidden';
    linkModal.id = 'link-editor-modal';
    linkModal.innerHTML = `
        <div class="ai-modal-content" style="max-width: 400px;">
            <div class="ai-modal-header">
                <h3>Edit Link</h3>
            </div>
            <div class="ai-modal-body">
                <div style="margin-bottom: 15px;">
                    <label style="font-size: 12px; font-weight: bold; display: block; margin-bottom: 5px;">Link Text</label>
                    <input type="text" id="link-text-input" placeholder="Click here" 
                           style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 15px;">

                    <label style="font-size: 12px; font-weight: bold; display: block; margin-bottom: 5px;">Link URL</label>
                    <input type="text" id="link-url-input" placeholder="https://example.com" 
                           style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div class="ai-modal-actions">
                    <button id="link-cancel-btn" class="editor-btn">Cancel</button>
                    <button id="link-save-btn" class="editor-btn btn-save">Apply</button>
                </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(linkModal);

    // Link Action Tooltip - Appended to body separately
    const linkTooltip = document.createElement('div');
    linkTooltip.id = 'link-action-tooltip';
    linkTooltip.style.cssText = "position: absolute; z-index: 10002; background: #333; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: none; pointer-events: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.3);";
    linkTooltip.innerHTML = `<button id="tooltip-edit-btn" style="background: none; border: none; color: white; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 5px;">Edit Link <i class="fas fa-pencil-alt"></i></button>`;
    document.body.appendChild(linkTooltip);

    // 3. Toggles
    toggleEditBtn.addEventListener('click', () => {
        if (isAIMode) toggleAIMode(false); // Exclusive modes
        isEditing = !isEditing;
        toggleEditBtn.classList.toggle('active', isEditing);
        controlsPanel.classList.toggle('hidden', !isEditing);
        
        if (isEditing) enableEditMode();
        else disableEditMode();
    });

    toggleAIBtn.addEventListener('click', () => {
        if (isEditing) toggleEditBtn.click(); // Turn off edit mode
        toggleAIMode(!isAIMode);
    });

    function toggleAIMode(active) {
        isAIMode = active;
        toggleAIBtn.classList.toggle('active', isAIMode);
        aiInfoPanel.classList.toggle('hidden', !isAIMode);
        
        if (isAIMode) {
            document.body.classList.add('ai-mode-active');
            document.addEventListener('mouseover', handleInspectorHover);
            document.addEventListener('click', handleInspectorClick);
            document.addEventListener('keydown', handleInspectorKey);
        } else {
            document.body.classList.remove('ai-mode-active');
            document.removeEventListener('mouseover', handleInspectorHover);
            document.removeEventListener('click', handleInspectorClick);
            document.removeEventListener('keydown', handleInspectorKey);
            highlighter.classList.add('hidden');
            aiActionBtn.classList.add('hidden');
            selectedElement = null;
        }
    }

    // 4. Edit Logic (Manual)
    const rootStyles = getComputedStyle(document.documentElement);
    const pColor = rootStyles.getPropertyValue('--primary-color').trim();
    const sColor = rootStyles.getPropertyValue('--secondary-color').trim();
    if(pColor) primaryPicker.value = pColor;
    if(sColor) secondaryPicker.value = sColor;

    primaryPicker.addEventListener('input', (e) => document.documentElement.style.setProperty('--primary-color', e.target.value));
    secondaryPicker.addEventListener('input', (e) => document.documentElement.style.setProperty('--secondary-color', e.target.value));

    function enableEditMode() {
        document.body.classList.add('admin-editing-active');
        
        // 1. Explicit text-heavy tags
        const explicitSelectors = 'h1, h2, h3, h4, h5, p, span, a, li, td, th, button, label, blockquote, pre, code, .card-title, .member-name-cn, .member-name-en';
        document.querySelectorAll(explicitSelectors).forEach(el => {
             if (editorToolbar.contains(el) || aiModal.contains(el)) return;
             el.contentEditable = "true";
        });

        // 2. Divs with direct text content (for "naked" text nodes)
        document.querySelectorAll('div').forEach(el => {
            if (editorToolbar.contains(el) || aiModal.contains(el)) return;
            
            // Check for non-empty direct text nodes
            let hasText = false;
            for (let node of el.childNodes) {
                if (node.nodeType === 3 && node.textContent.trim().length > 0) { // 3 = TEXT_NODE
                    hasText = true;
                    break;
                }
            }
            if (hasText) el.contentEditable = "true";
        });

        // 3. Images 
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', handleImageClick);
            img.style.cursor = 'pointer';
        });

        // 4. Links (prevent navigation, show tooltip on click)
        document.querySelectorAll('a').forEach(link => {
            if (!editorToolbar.contains(link)) {
                link.addEventListener('click', handleLinkClick);
            }
        });

        // Global click to custom tooltip handling
        document.addEventListener('click', handleGlobalClick);
    }

    function disableEditMode() {
        document.body.classList.remove('admin-editing-active');
        document.querySelectorAll('[contenteditable="true"]').forEach(el => el.contentEditable = "false");
        document.querySelectorAll('img').forEach(img => {
            img.removeEventListener('click', handleImageClick);
            img.style.cursor = '';
        });
        document.querySelectorAll('a').forEach(link => {
            link.removeEventListener('click', handleLinkClick);
        });
        document.removeEventListener('click', handleGlobalClick);
        hideLinkTooltip();
    }

    // 5. AI Inspector Logic
    let activeHoverElement = null;

    function handleInspectorHover(e) {
        if (!isAIMode || selectedElement) return;
        const target = e.target;
        if (editorToolbar.contains(target) || aiModal.contains(target) || target === highlighter || target === aiActionBtn) return;

        // Smart Selection: Prefer Parent if near edge
        let bestTarget = target;
        const threshold = 20; 
        
        if (target !== document.body && target.parentElement) {
            const rect = target.getBoundingClientRect();
            const distLeft = e.clientX - rect.left;
            const distRight = rect.right - e.clientX;
            const distTop = e.clientY - rect.top;
            const distBottom = rect.bottom - e.clientY;
            const minDist = Math.min(distLeft, distRight, distTop, distBottom);

            if (minDist < threshold) {
                bestTarget = target.parentElement;
            }
        }

        highlightElement(bestTarget);
    }

    function highlightElement(el) {
        const rect = el.getBoundingClientRect();
        highlighter.style.width = rect.width + 'px';
        highlighter.style.height = rect.height + 'px';
        highlighter.style.top = (rect.top + window.scrollY) + 'px';
        highlighter.style.left = (rect.left + window.scrollX) + 'px';
        highlighter.classList.remove('hidden');
        
        activeHoverElement = el;
    }

    function handleInspectorClick(e) {
        if (!isAIMode) return;
        const target = e.target;
        
        if (editorToolbar.contains(target) || aiModal.contains(target) || target === aiActionBtn) return;

        e.preventDefault();
        e.stopPropagation();
        
        const smartTarget = activeHoverElement || target;

        if (selectedElement === smartTarget) {
            selectedElement = null;
            activeHoverElement = null;
            aiActionBtn.classList.add('hidden');
            highlighter.classList.add('hidden');
            return;
        }

        selectedElement = smartTarget;
        highlightElement(smartTarget);
        
        aiActionBtn.style.top = (e.pageY + 10) + 'px';
        aiActionBtn.style.left = (e.pageX + 10) + 'px';
        aiActionBtn.classList.remove('hidden');
    }

    function handleInspectorKey(e) {
        if (!isAIMode || !selectedElement) return;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const parent = selectedElement.parentElement;
            if (parent && parent !== document.body && parent !== document.documentElement) {
                const rect = parent.getBoundingClientRect();
                updateSelection(parent, rect.left + rect.width/2, rect.top + rect.height/2);
            } else if (parent === document.body) {
                 updateSelection(document.body, window.scrollX + window.innerWidth/2, window.scrollY + window.innerHeight/2);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const child = selectedElement.firstElementChild;
            if (child) {
                const rect = child.getBoundingClientRect();
                updateSelection(child, rect.left + rect.width/2, rect.top + rect.height/2);
            }
        }
    }

    function updateSelection(el, x, y) {
        selectedElement = el;
        highlightElement(el);
        aiActionBtn.style.top = (y + window.scrollY) + 'px';
        aiActionBtn.style.left = (x + window.scrollX) + 'px';
        aiActionBtn.classList.remove('hidden');
    }

    // 6. AI Modal Logic
    aiActionBtn.addEventListener('click', () => {
        aiModal.classList.remove('hidden');
        document.getElementById('ai-prompt-input').focus();
        document.getElementById('ai-status-msg').style.display = 'none';
    });

    document.getElementById('ai-cancel-btn').addEventListener('click', () => {
        aiModal.classList.add('hidden');
    });

    document.getElementById('ai-generate-btn').addEventListener('click', () => {
        const promptInput = document.getElementById('ai-prompt-input');
        const modelSelect = document.getElementById('ai-model-select');
        const promptText = promptInput.value.trim();
        const model = modelSelect ? modelSelect.value : 'claude-3-5-sonnet-20240620'; // Default to Sonnet if select not found
        
        if (!promptText || !selectedElement) {
            alert("Please enter a prompt and ensure an element is selected.");
            return;
        }

        const htmlSnippet = selectedElement.outerHTML;
        const statusMsg = document.getElementById('ai-status-msg');
        
        statusMsg.textContent = "Sending to AI Agent... please wait.";
        statusMsg.style.display = 'block';
        statusMsg.style.color = '#003366';

        // Explicit call
        sendAIRequest(promptText, htmlSnippet, null, model);

        function sendAIRequest(prompt, context, imageBase64, model) {
            statusMsg.textContent = "Sending to AI Agent... please wait.";
            fetch('/api/ask-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    context: context,
                    image: imageBase64,
                    model: model
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.job_id) {
                    statusMsg.textContent = "AI Task Accepted. Processing in background... (will auto-refresh)";
                    statusMsg.style.color = '#003366';
                    pollAIJob(data.job_id, prompt, context);
                } else if (data.success) {
                    // Fallback for sync
                    handleAISuccess(data.output);
                } else {
                    handleAIError(data, prompt, context); 
                }
            })
            .catch(err => {
                console.error('Error:', err);
                statusMsg.textContent = "Failed to connect to server. Is python server.py running?";
                statusMsg.style.color = 'red';
            });
        }

        function pollAIJob(jobId, prompt, context) {
            const statusMsg = document.getElementById('ai-status-msg');
            
            setTimeout(() => {
                fetch(`/api/ai-status/${jobId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'processing') {
                         statusMsg.textContent = "Processing... (Please wait)";
                         pollAIJob(jobId, prompt, context); // Recurse
                    } else if (data.status === 'completed') {
                         const result = data.result;
                         if (result.success) {
                             handleAISuccess(result.output);
                         } else {
                             handleAIError(result, prompt, context);
                         }
                    } else if (data.status === 'error') {
                        statusMsg.textContent = "Error: " + (data.error || "Unknown job error");
                        statusMsg.style.color = 'red';
                    } else {
                        // Job not found or other
                        statusMsg.textContent = "Error: Job lost or expired.";
                        statusMsg.style.color = 'red';
                    }
                })
                .catch(err => {
                    console.error("Polling error", err);
                    statusMsg.textContent = "Connection error during polling. Retrying...";
                    pollAIJob(jobId, prompt, context); // Retry on network blip
                });
            }, 3000); // 3 seconds per user request
        }

        function handleAISuccess(output) {
            const statusMsg = document.getElementById('ai-status-msg');
            statusMsg.textContent = "AI Agent responded! Check your terminal or reload if changes were applied.";
            statusMsg.style.color = 'green';
            alert("AI Agent Output:\n" + output); 
            setTimeout(() => {
                aiModal.classList.add('hidden');
                toggleAIMode(false);
            }, 2000);
        }
        
        function handleAIError(data, promptText, htmlSnippet) {
             const statusMsg = document.getElementById('ai-status-msg');
             
             // Check if the backend provided a fallback prompt (indicating CLI missing or failed)
             if (data.prompt_for_clipboard || (data.error && data.error.includes('CLI'))) {
                // ... Existing fallback logic ...
                const fullPrompt = data.prompt_for_clipboard || `Task: ${promptText}\n\nContext HTML:\n${htmlSnippet}`;            
    
                const copyToClipboard = (text) => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                            return navigator.clipboard.writeText(text);
                    } else {
                            // Fallback for non-secure contexts
                            return new Promise((resolve, reject) => {
                                const textArea = document.createElement("textarea");
                                textArea.value = text;
                                textArea.style.position = "fixed";
                                textArea.style.left = "-9999px";
                                document.body.appendChild(textArea);
                                textArea.focus();
                                textArea.select();
                                try {
                                    document.execCommand('copy');
                                    document.body.removeChild(textArea);
                                    resolve();
                                } catch (err) {
                                    document.body.removeChild(textArea);
                                    reject(err);
                                }
                            });
                    }
                };

                copyToClipboard(fullPrompt).then(() => {
                    statusMsg.textContent = "Claude CLI not found. Prompt copied to clipboard!";
                    statusMsg.style.color = '#e67e22'; // Orange/Warning
                    alert("Warning: 'claude' CLI not installed/found on server.\n\nFallback: Prompt has been copied to your clipboard.");
                    setTimeout(() => {
                        aiModal.classList.add('hidden');
                        toggleAIMode(false);
                    }, 2000);
                }).catch(() => {
                        // Async Clipboard Failure (likely no user gesture)
                        statusMsg.innerHTML = `
                            <span style="color: red;">Claude CLI missing & Auto-Copy failed.</span><br>
                            <button id="manual-copy-btn" style="margin-top:5px; padding:5px 10px; cursor:pointer;">Click to Copy Prompt</button>
                        `;
                        // Bind click to the new button
                        setTimeout(() => {
                            const btn = document.getElementById('manual-copy-btn');
                            if(btn) btn.onclick = () => {
                                copyToClipboard(fullPrompt).then(() => {
                                    alert("Copied to clipboard!");
                                    aiModal.classList.add('hidden');
                                });
                            };
                        }, 100);
                });
            } else {
                statusMsg.textContent = "Error: " + (data.error || "Unknown error");
                statusMsg.style.color = 'red';
            }
        }
    });

    // 7. Helpers
    let activeImageElement = null;

    function handleImageClick(e) {
        e.preventDefault();
        e.stopPropagation();
        activeImageElement = e.target;
        
        const imgModal = document.getElementById('image-editor-modal');
        const urlInput = document.getElementById('img-url-input');
        
        // Reset state
        urlInput.value = activeImageElement.src;
        document.getElementById('img-tab-url').click(); // Default to URL
        document.getElementById('upload-status').textContent = '';
        document.getElementById('img-file-input').value = '';
        
        imgModal.classList.remove('hidden');
    }

    // Image Modal Logic
    document.getElementById('img-cancel-btn').addEventListener('click', () => {
        document.getElementById('image-editor-modal').classList.add('hidden');
        activeImageElement = null;
    });

    document.getElementById('img-tab-url').addEventListener('click', (e) => {
        e.target.classList.add('active');
        document.getElementById('img-tab-upload').classList.remove('active');
        document.getElementById('img-panel-url').classList.remove('hidden');
        document.getElementById('img-panel-upload').classList.add('hidden');
    });

    document.getElementById('img-tab-upload').addEventListener('click', (e) => {
        e.target.classList.add('active');
        document.getElementById('img-tab-url').classList.remove('active');
        document.getElementById('img-panel-upload').classList.remove('hidden');
        document.getElementById('img-panel-url').classList.add('hidden');
    });

    document.getElementById('img-save-btn').addEventListener('click', () => {
        const isUpload = document.getElementById('img-tab-upload').classList.contains('active');
        const imgModal = document.getElementById('image-editor-modal');
        
        if (isUpload) {
            const fileInput = document.getElementById('img-file-input');
            const file = fileInput.files[0];
            if (!file) {
                alert("Please select a file first.");
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            
            const statusEl = document.getElementById('upload-status');
            statusEl.textContent = "Uploading...";
            
            fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
                // Note: Do NOT set Content-Type header manually for FormData, browser does it with boundary
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (activeImageElement) activeImageElement.src = data.url;
                    imgModal.classList.add('hidden');
                } else {
                    alert("Upload failed: " + (data.error || "Unknown error"));
                    statusEl.textContent = "Upload failed.";
                }
            })
            .catch(err => {
                console.error(err);
                alert("Upload error: " + err.message);
                statusEl.textContent = "Error.";
            });

        } else {
            const newSrc = document.getElementById('img-url-input').value;
            if (newSrc && activeImageElement) {
                activeImageElement.src = newSrc;
                imgModal.classList.add('hidden');
            }
        }
    });

    // Link Editor Modal Logic
    let activeLinkElement = null;

    function handleLinkClick(e) {
        e.preventDefault();
        e.stopPropagation();
        activeLinkElement = e.currentTarget; 
        
        // Show Tooltip
        const tooltip = document.getElementById('link-action-tooltip');
        const rect = activeLinkElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        tooltip.style.top = (rect.top + scrollTop - 40) + 'px'; // Position above
        tooltip.style.left = (rect.left + scrollLeft) + 'px';
        tooltip.style.display = 'block';
    }

    function hideLinkTooltip() {
        const tooltip = document.getElementById('link-action-tooltip');
        if(tooltip) tooltip.style.display = 'none';
    }

    function handleGlobalClick(e) {
        const tooltip = document.getElementById('link-action-tooltip');
        if (tooltip && tooltip.style.display === 'block') {
            // If click is not on tooltip and not on a link, hide it
            if (!tooltip.contains(e.target) && !e.target.closest('a')) {
                hideLinkTooltip();
            }
        }
    }

    // Tooltip Edit Button
    document.getElementById('tooltip-edit-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideLinkTooltip();
        
        if (activeLinkElement) {
             const linkModal = document.getElementById('link-editor-modal');
            const urlInput = document.getElementById('link-url-input');
            const textInput = document.getElementById('link-text-input');
            
            const currentHref = activeLinkElement.getAttribute('href');
            
            // Safe Text Handling: Check if link has HTML children (like the resource cards)
            if (activeLinkElement.children.length > 0) {
                // Complex structure: Disable text editing to prevent wiping out HTML
                textInput.value = "(Complex HTML Content - URL Only)";
                textInput.disabled = true;
                textInput.style.backgroundColor = "#eee";
                textInput.style.color = "#999";
                textInput.removeAttribute('data-original');
            } else {
                // Simple text link
                const currentText = activeLinkElement.innerText;
                textInput.value = currentText;
                textInput.disabled = false;
                textInput.style.backgroundColor = "white";
                textInput.style.color = "black";
                textInput.setAttribute('data-original', currentText);
            }

            urlInput.value = currentHref;
            
            linkModal.classList.remove('hidden');
        }
    });

    document.getElementById('link-cancel-btn').addEventListener('click', () => {
        document.getElementById('link-editor-modal').classList.add('hidden');
        activeLinkElement = null;
    });

    document.getElementById('link-save-btn').addEventListener('click', () => {
        const newHref = document.getElementById('link-url-input').value;
        const newText = document.getElementById('link-text-input').value;
        const inputElement = document.getElementById('link-text-input');
        
        if (activeLinkElement) {
            activeLinkElement.href = newHref;
            
            // Only update text if NOT disabled (simple link) AND text changed
            if (!inputElement.disabled) {
                 const originalText = inputElement.getAttribute('data-original');
                 if (newText !== originalText) {
                    activeLinkElement.innerText = newText;
                 }
            }
            
            document.getElementById('link-editor-modal').classList.add('hidden');
        }
    });

    // 8. Export/Publish Logic
    saveBtn.textContent = "Publish Changes"; // Rename button
    saveBtn.addEventListener('click', () => {
        if(!confirm("Are you sure you want to overwrite the live page?")) return;

        disableEditMode();
        toggleAIMode(false);
        const clone = document.documentElement.cloneNode(true);
        const elsToRemove = clone.querySelectorAll('#admin-editor-toolbar, .ai-highlighter, .ai-action-btn, .ai-modal, #link-action-tooltip, #admin-editor-styles, #image-editor-modal, #link-editor-modal');
        elsToRemove.forEach(el => el.remove());
        
        // Remove injected aiditor.js script to prevent duplication
        const scripts = clone.querySelectorAll('script');
        scripts.forEach(s => {
            if (s.src && s.src.includes('aiditor.js')) s.remove();
        });

        // Clean up empty style and class attributes (e.g. from cleared cursor styles or toggled classes)
        clone.querySelectorAll('*').forEach(el => {
            if (el.hasAttribute('style') && el.getAttribute('style').trim() === '') {
                el.removeAttribute('style');
            }
            if (el.classList.length === 0 && el.hasAttribute('class')) {
                el.removeAttribute('class');
            }
        });

        // SANITIZATION: Clear dynamic header/footer to avoid baking in
        const header = clone.querySelector('#main-header');
        if(header) header.innerHTML = '';
        const footer = clone.querySelector('#main-footer');
        if(footer) footer.innerHTML = '';

        // CLEANUP: Remove contentEditable and active class
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        const body = clone.querySelector('body');
        if(body) body.classList.remove('admin-editing-active');

        const htmlContent = "<!DOCTYPE html>\n" + clone.outerHTML;
        const pageName = window.location.pathname.split('/').pop() || 'index.html';

        // Send to Server
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Publishing...";
        saveBtn.disabled = true;

        fetch('/api/admin/save-page', {
            method: 'POST',
            credentials: 'include', // Ensure session cookies are sent
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page: pageName,
                content: htmlContent
            })
        })
        .then(res => {
            if(res.ok) {
                alert("Success! Page updated.");
                window.location.reload(); 
            } else {
                if (res.status === 401) {
                    throw new Error("Session expired. Please log in again at /admin/login.html");
                }
                return res.text().then(text => {
                    try {
                        const d = JSON.parse(text);
                        throw new Error(d.error || `Server Error (${res.status})`);
                    } catch(e) {
                         throw new Error(`Server Error (${res.status})`);
                    }
                });
            }
        })
        .catch(err => {
            console.error(err);
            alert("Failed to publish: " + err.message);
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        });
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}
