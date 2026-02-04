import { log } from "../../../bootstrap.js";

const injectedTabs = new Set();

/**
 * inject audio defenses into a tab ONLY ONCE.
 * @param {*} ctx 
 */
async function inject(ctx) {
    console.log("CONSEAL: Injecting AudioContext defense into page...");
    const { tabId, frameId } = ctx;

    const key = `${tabId}:${frameId}`;
    if (injectedTabs.has(key)) return;

    try {
        await browser.tabs.executeScript(tabId, {
            file: "js/conseal/defenses/audio/scrambler.js",
            frameId,
            runAt: "document_start"
        });

        console.log(`CONSEAL: AudioContext defense injected (${key})`);
        injectedTabs.add(key);
    } catch (e) {
        console.error(`CONSEAL: AudioContext defense injection failed (${key})`, e);
    }
}


export default {
    inject
};