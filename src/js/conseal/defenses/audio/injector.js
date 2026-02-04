import { log } from "../../../bootstrap.js";

/**
 * inject audio defenses into the page
 * @param {*} ctx 
 */
async function inject(ctx) {
    console.log("CONSEAL: Injecting AudioContext defense into page...");
    const { tabId, frameId } = ctx;

    try {
        await browser.tabs.executeScript(tabId, {
            file: "js/conseal/defenses/audio/scrambler.js",
            frameId,
            runAt: "document_start"
        });

        console.log(`CONSEAL: AudioContext defense injected. `);
    } catch (e) {
        console.error(`CONSEAL: AudioContext defense injection failed. `, e);
    }
}


export default {
    inject
};