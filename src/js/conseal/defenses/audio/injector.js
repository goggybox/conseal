
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------


/**
 * inject audio defenses into the page
 * @param {*} ctx 
 */
async function inject(ctx) {
    console.log("CONSEAL: Injecting AudioContext defense into page...");
    const { tabId, frameId } = ctx;

    try {
        // expose tabId to page context.
        await browser.tabs.executeScript(tabId, {
            code: `
                window.__CONSEAL_TAB_ID__ = ${tabId};
            `,
            frameId,
            runAt: "document_start"
        });

        // inject scrambler
        await browser.tabs.executeScript(tabId, {
            file: "js/conseal/defenses/audio/scrambler.js",
            frameId,
            runAt: "document_start"
        });

        console.log(`CONSEAL: AudioContext defense injected.`);
    } catch (e) {
        console.error(`CONSEAL: AudioContext defense injection failed. `, e);
    }
}


export default {
    inject
};
