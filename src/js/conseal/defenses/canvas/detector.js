

/**
 * this detecotr does NOT implement *defenses* against Canvas Fingerprinting,
 * it instead just detects fingerprinting attempts made by websites. Randomisation
 * of identifying canvas attributes is handled by Firefox's built-in resistFingerprint
 * defenses (RFP). RFP does not provide feedback/notification when attempts are made to
 * access Canvas data, hence Conseal must independently detect these attempts here.
 */

/**
 * Canvas Fingerprinting detection is inspired by CanvasBlocker by kkapsner
 * (https://github.com/kkapsner/CanvasBlocker  )
 */

/**
 * uses heuristics to attempt to differentiate between legitimate and suspicious
 * canvas uses. could lead to some fingerprinting going undetected - HOWEVER, this
 * code is once again only detection, defenses are handled by RFP and are more robust.
 */

(function() {
    console.log("[CONSEAL][canvas] RFP-safe detector loaded", location.href);
    
    const trackedCanvases = new WeakMap();
    const reportedMethods = new Set();
    const FP_CANVAS_MAX_SIZE = 2500;

    function reportAttempt(method, category, detail = {}) {
        try {
            chrome.runtime.sendMessage({
                type: 'recordConsealTrackingAttempt',
                method: 'canvas',
                detail: { canvasMethod: method, category, ...detail },
                url: location.href,
                tabId: window.__CONSEAL_TAB_ID__
            });
        } catch (e) {
            // silently fail
        }
    }

    // wrap Canvas API methods to report when access attempts are made
    function wrapMethod(target, methodName, category, className) {
        if (!target?.prototype?.[methodName] || reportedMethods.has(`${className}.${methodName}`)) return;
        
        const original = target.prototype[methodName];
        reportedMethods.add(`${className}.${methodName}`);
        
        exportFunction(function(...args) {
            if (isSuspiciousCanvas(this)) {
                reportAttempt(methodName, category, { 
                    canvasSize: getCanvasSize(this),
                    inDOM: isCanvasInDOM(this)
                });
            }
            return original.call(this, ...args);
        }, target.prototype, { defineAs: methodName });
        
        console.log(`[CONSEAL][canvas] Wrapped: ${className}.${methodName}`);
    }

    // determine whether the given canvas is likely used for fingerprinting.
    // we will only report attempts if the canvas is deemed suspicious.
    function isSuspiciousCanvas(contextOrCanvas) {
        try {
            const canvas = contextOrCanvas instanceof HTMLCanvasElement 
                ? contextOrCanvas 
                : (contextOrCanvas.canvas || null);
            
            if (!canvas) return false;
            
            // prevent the same canvas being wrapped multiple times
            if (!trackedCanvases.has(canvas)) {
                trackedCanvases.set(canvas, {
                    createdAt: Date.now(),
                    drawCount: 0,
                    reported: false
                });
            }
            
            const meta = trackedCanvases.get(canvas);
            meta.drawCount++;
            
            // heuristics used to determine whether a canvas is suspicious:
            // 1. canvas is hidden/offscreen OR not in DOM (common for fingerprinting scripts)
            const isHidden = !isCanvasVisible(canvas);
            // 2. high drawing frequency early in lifecycle (fingerprinting scripts draw then immediately read)
            const isRapidDraw = meta.drawCount > 2 && (Date.now() - meta.createdAt) < 2000;
            // 3. small canvas size (common for fingerprinting scripts)
            const { width, height } = getCanvasSize(canvas);
            const isSmall = width <= FP_CANVAS_MAX_SIZE && height <= FP_CANVAS_MAX_SIZE;
        
            // only report if deemed to be suspicious
            if (!meta.reported && (isHidden || isSmall || isRapidDraw)) {
                meta.reported = true;
                return true;
            }
        } catch (e) { 
            // fail safely
        }
        return false;
    }

    function getCanvasSize(canvas) {
        try {
            return {
                width: canvas.width || canvas.offsetWidth || 0,
                height: canvas.height || canvas.offsetHeight || 0
            };
        } catch { return { width: 0, height: 0 }; }
    }

    function isCanvasInDOM(canvas) {
        try { return document.body.contains(canvas); } catch { return false; }
    }

    function isCanvasVisible(canvas) {
        if (!isCanvasInDOM(canvas)) return false;
        const rect = canvas.getBoundingClientRect();
        return (
            rect.width > 0 && 
            rect.height > 0 && 
            rect.top < window.innerHeight && 
            rect.left < window.innerWidth
        );
    }

    // Wrap HIGH-VALUE fingerprinting drawing methods only
    function wrapCanvasInputMethods() {
        const fpDrawingMethods = [
            'fillText',
            'strokeText',
            'drawImage'
        ];
        
        fpDrawingMethods.forEach(method => {
            wrapMethod(window.CanvasRenderingContext2D, method, 'input', 'CanvasRenderingContext2D');
        });
    }

    // track context acquisition
    function trackCanvasElements() {
        if (!window.HTMLCanvasElement?.prototype?.getContext) return;
        
        const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
        exportFunction(function(...args) {
            const ctx = originalGetContext.apply(this, args);
            if (ctx && !trackedCanvases.has(this)) {
                trackedCanvases.set(this, { 
                    createdAt: Date.now(), 
                    drawCount: 0,
                    reported: false,
                    contextType: args[0] 
                });
                // report attempt only if canvas is suspicious
                if (isSuspiciousCanvas(this)) {
                    reportAttempt('getContext', 'input', { 
                        contextType: args[0],
                        canvasSize: getCanvasSize(this)
                    });
                }
            }
            return ctx;
        }, window.HTMLCanvasElement.prototype, { defineAs: 'getContext' });
    }

    // monitor canvas element creation for hidden/offscreen elements
    function observeCanvasElements() {
        if (!window.MutationObserver) return;
        
        new MutationObserver((mutations) => {
            for (const mut of mutations) {
                for (const node of mut.addedNodes) {
                    if (node.tagName === 'CANVAS' && isSuspiciousCanvas(node)) {
                        setTimeout(() => {
                            if (trackedCanvases.has(node) && !trackedCanvases.get(node).reported) {
                                reportAttempt('hiddenCanvasCreated', 'heuristic', {
                                    canvasSize: getCanvasSize(node)
                                });
                            }
                        }, 100);
                    }
                }
            }
        }).observe(document, { childList: true, subtree: true });
    }

    wrapCanvasInputMethods();
    trackCanvasElements();
    observeCanvasElements();
    
    console.log("[CONSEAL][canvas] RFP-safe tracking initialised (input/heuristics only)");
})();