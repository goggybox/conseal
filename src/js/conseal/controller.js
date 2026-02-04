import { log } from "../bootstrap.js";
import audioDefense from "./defenses/audio/injector.js";

let badger;

function init(data) {
    badger = data["badger"];
    console.log("CONSEAL: Initialised Conseal");

    browser.webNavigation.onCommitted.addListener(
        injectOnPageLoad,
        { url: [{ schemes: ["http", "https"] }] }
    );
};

function injectOnPageLoad(details) {
    const { tabId, frameId, url } = details;
    if (frameId !== 0) { return; }

    const level = getProtectionLevel();
    if (!level || level === 0) {
        console.log(`CONSEAL: No first-party defenses for ${url}`);
        return;
    }

    const ctx = { tabId, frameId, url };
    
    if (level === 2) {
        // HIGH LEVEL defenses:
        //      - AudioContext (handled here)
        audioDefense.inject(ctx);
    }
    else if (level === 1) {
        // MILD LEVEL defenses
    }
}

/**
 * function to handle first-party requests
 * intercepted by Privacy Badger.
 * @param {*} ctx data from web request
 */
function handle(ctx) {
    if (!badger) { return; }

    const level = getProtectionLevel();

    if (level == 2) {
        // HIGH LEVEL defenses:
        //      - AudioContext (handled by injectOnPageLoad)

    }
    else if (level == 1) {
        // MILD LEVEL defenses

    }
    else {
        // NO FIRST-PARTY DEFENSES ENABLED
        return;
    }
}


/**
 * get protection level from Badger storage
 */
function getProtectionLevel() {
    return badger.getSettings().getItem("protectionLevel");
}

function setProtectionLevel(new_level) {
    return badger.getSettings().setItem("protectionLevel", new_level);
}


export default {
    init,
    injectOnPageLoad,
    handle,
    getProtectionLevel,
    setProtectionLevel
};