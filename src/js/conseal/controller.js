
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

import { log } from "../bootstrap.js";
import audioDefense from "./defenses/audio/injector.js";
import statsStorage from "./statsController.js";

let badger;

/**
 * entries keyed by tabId:
 * {
 *   url,
 *   startedAt,
 *   total,
 *   methods {
 *     "audiocontext": 1,
 *     ...
 *   }
 * }
 *      
 */
let sessionAttempts = new Map();

function init(data) {
    badger = data["badger"];
    console.log("CONSEAL: Initialised Conseal");

    // run injectOnPageLoad when page load event fires
    browser.webNavigation.onCommitted.addListener(
        injectOnPageLoad,
        { url: [{ schemes: ["http", "https"] }] }
    );

    // clean up sessionAttempts when a tab closes
    browser.tabs.onRemoved.addListener((tabId) => {
        sessionAttempts.delete(tabId);
    });
};

function injectOnPageLoad(details) {
    const { tabId, frameId, url } = details;
    if (frameId !== 0) { return; }

    const level = getProtectionLevel();
    if (!level || level === 0) {
        return;
    }

    const ctx = { tabId, frameId, url };

    // ----- TRACK ATTEMPTS -----
    sessionAttempts.set(tabId, {
        url,
        startedAt: Date.now(),
        total: 0,
        methods: {}
    });

    // ----- INJECT DEFENSES -----
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
 * function handle canvas first-party fingerprinting attempts
 * intercepted by Privacy Badger - PB ignores first-party
 * attempts by default.
 * @param {*} tab_id 
 * @param {*} msg 
 */
function handleFingerprinting(tab_id, msg) {
    if (!msg.scriptUrl || !msg.prop) { return; }

    const method = msg.prop;
    recordTrackingAttempt(method, msg.scriptUrl, tab_id);
}

function recordTrackingAttempt(method, url, tabId) {
    const urlObj = new URL(url);
    const site = urlObj.hostname;

    statsStorage.recordAttempt(badger, site, method);

    // update tracking attempts for current session
    //      - volatile, only for session lifetime
    const session = sessionAttempts.get(tabId);
    if (!session) {
        return; 
    }
    session.total += 1;
    session.methods[method] = (session.methods[method] || 0) + 1;

    // update extension badge counter
    updateBadgeCounter(tabId, session.total);
}

function updateBadgeCounter(tabId, num) {
    const root = document.documentElement;
    const backrgoundColour = getComputedStyle(root).getPropertyValue('--badge-background-colour').trim();
    const textColour = getComputedStyle(root).getPropertyValue('--badge-text-colour').trim();
    chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: backrgoundColour});
    chrome.browserAction.setBadgeTextColor({ tabId: tabId, color: textColour });
    chrome.browserAction.setBadgeText({ tabId: tabId, text: num.toString() + "" });

}

// ---------- GETTERS AND SETTERS ----------

/**
 * get protection level from Badger storage
 */
function getProtectionLevel() {
    return badger.getSettings().getItem("protectionLevel");
}

function setProtectionLevel(new_level) {
    return badger.getSettings().setItem("protectionLevel", new_level);
}

function getSessionAttempts(tabId) {
    return sessionAttempts.get(tabId) || null;
}

function getAllSessionAttempts() {
    return Array.from(sessionAttempts.entries());
}

export default {
    init,
    injectOnPageLoad,
    handle,
    getProtectionLevel,
    setProtectionLevel,
    recordTrackingAttempt,
    getSessionAttempts,
    getAllSessionAttempts,
    handleFingerprinting
};