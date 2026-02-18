
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

let dataMap = new Map();
let allEntries = [];

let isLoading = false;
let hasLoaded = false;
let loadError = null;

const ratingHierarchy = ["A", "B", "C", "D", "E"];

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
        allEntries = data;

        for (const entry of data) {
            const domains = entry.url.split(",");
            for (const domain of domains) {
                const normalised = normaliseDomain(domain);
                dataMap.set(normalised, {
                    id: entry.id,
                    name: entry.name,
                    rating: entry.rating,
                    category: entry.category || "unknown"
                });
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
        console.log(`Map size: ${dataMap.size}`);
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

async function getDomainRatingAndAlternatives(inp) {
    await ensureDataLoaded();

    const normalised = normaliseDomain(inp);
    const current = dataMap.get(normalised);

    if (!current) return null;
    const alternatives = await getHigherRatedInCategory(current);

    return {
        ...current,
        alternatives
    };
}

/**
 * compare two ratings.
 * returns true if ratingA is higher than ratingB 
 * eg returns true if ratingA=B and ratingB=E
 * @param {*} ratingA 
 * @param {*} ratingB 
 */
function isHigherRating(ratingA, ratingB) {
    return ratingHierarchy.indexOf(ratingA) < ratingHierarchy.indexOf(ratingB);
}

/**
 * get all entries of the same category that have a higher rating
 * @param {*} input - either a domain string, or entry object from getDomainRating
 */
async function getHigherRatedInCategory(input) {
    await ensureDataLoaded();
    let current;

    if (typeof input === "string") {
        const normalised = normaliseDomain(input);
        current = dataMap.get(normalised);
    } else {
        current = input;
    }

    if (!current || !current.category) return [];

    const { category, rating } = current;

    return allEntries
        .filter(entry =>
            entry.category === category &&
            entry.rating &&
            isHigherRating(entry.rating, rating)
        )
        .map(entry => ({
            id: entry.id,
            name: entry.name,
            rating: entry.rating,
            category: entry.category
        }));
}

export default {
    getDomainRating,
    getHigherRatedInCategory,
    getDomainRatingAndAlternatives
};