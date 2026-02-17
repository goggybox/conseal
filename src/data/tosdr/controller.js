
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

let dataMap = new Map();
let isLoading = false;
let hasLoaded = false;
let loadError = null;

/**
 * lazy load the data only when requested - ensures service worker is awake
 */
async function ensureDataLoaded() {
    if (hasLoaded) return;
    if (isLoading) {
        while (isLoading && !hasLoaded && !loadError) {
            await new Promise(r => setTimeout(r, 50)); 
        }
        if (loadError) throw loadError;
        return;
    }

    isLoading = true;
    try {
        console.log("Initialising ToS;DR controller (Lazy Load)");
        const url = chrome.runtime.getURL("data/tosdr/dump.json"); 
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to load ToS;DR data dump: ${response.status}`);
        }

        const data = await response.json();

        for (const entry of data) {
            const domains = entry.url.split(",");
            for (const domain of domains) {
                const normalised = normaliseDomain(domain);
                dataMap.set(normalised, entry.rating);
            }
        }

        hasLoaded = true;
        console.log("ToS;DR data loaded successfully");
    } catch (err) {
        loadError = err;
        console.error("ToS;DR Load Error:", err);
        throw err;
    } finally {
        isLoading = false;
    }
}

function normaliseDomain(domain) {
    return domain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
        .trim();
}

async function getDomainRating(inp) {
    await ensureDataLoaded();
    const normalised = normaliseDomain(inp);
    return dataMap.get(normalised) || null;
}

export default {
    getDomainRating
};