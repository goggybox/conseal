

/**
 * this injector does NOT implement *defenses* against Canvas Fingerprinting,
 * it instead just detects fingerprinting attempts made by websites. Randomisation
 * of identifying canvas attributes is handled by Firefox's built-in resistFingerprint
 * defenses (RFP). RFP does not provide feedback/notification when attempts are made to
 * access Canvas data, hence Conseal must independently detect these attempts here.
 */

/**
 * Canvas Fingerprinting detection is inspired by CanvasBlocker by kkapsner
 * (https://github.com/kkapsner/CanvasBlocker)
 */

async function inject(ctx) {
    console.log("CONSEAL: Injecting Canvas detection into page...");
    const { tabId, frameId } = ctx;

    try {
        // expose tabId to page context
        await browser.tabs.executeScript(tabId, {
            code: `
                window.__CONSEAL_TAB_ID__ = ${tabId};
            `,
            frameId,
            runAt: "document_start"
        });

        // inject detector
        await browser.tabs.executeScript(tabId, {
            file: "js/conseal/defenses/canvas/detector.js",
            frameId,
            runAt: "document_start"
        });
    } catch (e) {
        console.error(`CONSEAL: Canvas detection injection failed: ${e}`);
    }
}

export default {
    inject
}