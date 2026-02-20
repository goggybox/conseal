
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

import audioDefense from "./defenses/audio/injector.js";
import statsStorage from "./statsController.js";
import tosdr from "../../data/tosdr/controller.js";
import { Generator } from "./defenses/profiles/profiles.js";

let badger;


let profileGenerator;
let tabProfiles = new Map(); // maintain separate profiles for each tab

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
    profileGenerator = new Generator([]);

    // run injectOnPageLoad when page load event fires
    browser.webNavigation.onCommitted.addListener(
        injectOnPageLoad,
        { url: [{ schemes: ["http", "https"] }] }
    );

    // clean up sessionAttempts when a tab closes
    // also clean up the tab's profile.
    browser.tabs.onRemoved.addListener((tabId) => {
        sessionAttempts.delete(tabId);
        tabProfiles.delete(tabId);
    });

    console.log("CONSEAL: Initialised Conseal");
};

function getOrCreateProfileForTab(tabId, osPreference = 'randomDesktop') {
    if (tabProfiles.has(tabId)) {
        // return existing profile for tab
        return tabProfiles.get(tabId);
    }

    // generate new profile for the tab ...

    const profileId = profileGenerator.getRandomByDevice(osPreference);
    if (profileId === 'none') {
        return null;
    }

    const profile = profileGenerator.getProfile(profileId);

    tabProfiles.set(tabId, {
        id: profileId,
        data: profile,
        createdAt: Date.now()
    });

    return tabProfiles.get(tabId);
}

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
        //      - profile generation
        audioDefense.inject(ctx);

        // const profileEntry = getOrCreateProfileForTab(tabId, 'randomDesktop');
        // if (profileEntry) {
        //     applyFingerprintProfile(tabId, profileEntry.data);
        // }
    }
    else if (level === 1) {
        // MILD LEVEL defenses
    }
}

async function applyFingerprintProfile(tabId, profile) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: false },
            func: spoofPageContext,
            args: [profile]
        });
    } catch (err) {
        console.warn(`CONSEAL failed to inject profile for tab ${tabId}:`, err);
    }
}
function spoofPageContext(profile) {
    if (window.__consealProfileApplied) {
        return;
    }
    window.__consealProfileApplied = true;

    if (profile.navigator) {
        const nav = profile.navigator;

        const overrideProp = (obj, prop, value) => {
            if (value === null || value === undefined) { return; }
            try {
                Object.defineProperties(obj, prop, {
                    get: () => value,
                    configurable: true,
                    enumerable: true
                });
            } catch (e) {
                console.log(`CONSEAL could not override navigator.${prop}`);
            }
        };

        overrideProp(navigator, 'userAgent', nav.userAgent);
        overrideProp(navigator, 'platform', nav.platform);
        overrideProp(navigator, 'vendor', nav.vendor);
        overrideProp(navigator, 'vendorSub', nav.vendorSub);
        overrideProp(navigator, 'productSub', nav.productSub);
        overrideProp(navigator, 'appVersion', nav.appVersion);
        overrideProp(navigator, 'appMinorVersion', nav.appMinorVersion);
        overrideProp(navigator, 'cpuClass', nav.cpuClass);
        overrideProp(navigator, 'oscpu', nav.oscpu);
        overrideProp(navigator, 'buildID', nav.buildID);

        if (nav.hardwareConcurrency !== null) {
            overrideProp(navigator, 'hardwareConcurrency', nav.hardwareConcurrency);
        }
        if (nav.deviceMemory !== null) {
            overrideProp(navigator, 'deviceMemory', nav.deviceMemory);
        }
        if (nav.maxTouchPoints !== null) {
            overrideProp(navigator, 'maxTouchPoints', nav.maxTouchPoints);
        }
        
        if (nav.plugins !== null) {
            overrideProp(navigator, 'plugins', createPluginArray(nav.plugins));
        }
        if (nav.mimeTypes !== null) {
            overrideProp(navigator, 'mimeTypes', createMimeTypeArray(nav.mimeTypes));
        }
    }

    if (profile.screen && window.screen) {
        const scr = profile.screen;

        const screenProxy = new Proxy(window.screen, {
            get (target, prop) {
                if (prop === 'width' && scr.width !== undefined) { return scr.width; }
                if (prop === 'height' && scr.height !== undefined) { return scr.height; }
                if (prop === 'availHeight' && scr.availHeight !== undefined) { return scr.availHeight; }
                if (prop === 'deviceScaleFactor' && scr.deviceScaleFactor !== undefined) { return scr.deviceScaleFactor; }
                return Reflect.get(target, prop);
            }
        });

        Object.defineProperty(window, 'screen', {
            value: screenProxy,
            configurable: true,
            writable: true
        });
    }

    function createPluginArray(plugins) {
        const arr = [];
        arr.namedItem = (name) => plugins.find(p => p.name === name) || null;
        arr.refresh = () => {};
        arr.length = plugins.length;
        plugins.forEach((p, i) => {
            arr[i] = {
                name: p.name,
                filename: p.filename,
                description: p.description,
                length: p.__mimeTypes?.length || 0,
                item: (idx) => p.__mimeTypes?.[idx] || null,
                namedItem: (type) => p.__mimeTypes?.find(m => m === type) || null
            };
            Object.defineProperty(arr, i, { enumerable: true });
        });
        return arr;
    }

    function createMimeTypeArray(mimeTypes) {
        const arr = [];
        arr.namedItem = (type) => mimeTypes.find(m => m.type === type) || null;
        arr.length = mimeTypes.length;
        mimeTypes.forEach((m, i) => {
            arr[i] = {
                type: m.type,
                suffixes: m.suffixes,
                description: m.description,
                enabledPlugin: arr
            };
            Object.defineProperty(arr, i, { enumerable: true });
        });
        return arr;
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

    // only highest level of protection includes canvas fingerprinting
    // defenses; ignore it if not in highest level
    if (getProtectionLevel() !== 2) {
        return;
    }

    // msg.prop does list a specific method, such as textFill, but we
    // want just canvas.
    recordTrackingAttempt("canvas", msg.scriptUrl, tab_id);
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

async function getDomainRating(inp) {
    try {
        const rating = await tosdr.getDomainRating(inp);
        return rating;
    } catch (error) {
        console.error("Failed to get domain rating:", error);
        return null;
    }
}

async function getDomainRatingAndAlternatives(inp) {
    try {
        const rating = await tosdr.getDomainRatingAndAlternatives(inp);
        return rating;
    } catch (error) {
        console.error("Failed to get domain rating:", error);
        return null;
    }
}

function getProfileForTab(tabId) {
    return tabProfiles.get(tabId)?.data || null;
}

function regenerateProfileForTab(tabId, osPreference = 'randomDesktop') {
    tabProfiles.delete(tabId);
    return getOrCreateProfileForTab(tabId, osPreference);
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
    handleFingerprinting,
    getDomainRating,
    getDomainRatingAndAlternatives//,
    // getProfileForTab,
    // regenerateProfileForTab
};