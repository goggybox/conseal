
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

/**
 * CONSEAL keeps track of how many attempts each
 * website makes to access identifying information.
 * This information is stored using Privacy Badger's
 * existing storage system
 *  - tracks total number of attempts made for each method,
 *  - also tracks weekly totals, allowing for a weekly average
 *    to be calculated. ( ONLY KEEPS THE LAST 12 WEEKS )
 */

import { log } from "../bootstrap.js";

const STORAGE_KEY = "conseal_tracking_stats";
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

let writeQueue = Promise.resolve();

function recordAttempt(badger, site, method) {

    writeQueue = writeQueue.then(async () => {
        console.log(`Storing ${method} attempt from ${site}`);
        if (!site || !method) { return; }

        const data = await getAllStats(badger);
        const now = Date.now();

        if (!data[site]) {
            // we do not yet have stats for this site. initialise
            data[site] = {
                methods: {},
                firstSeen: now,
                lastUpdated: now
            };
        }

        if (!data[site].methods[method]) {
            // we do not yet have stats for this site for
            // this particular method. initialise
            data[site].methods[method] = {
                total: 0,
                weeklyAverage: 0,
                history: [], // for each week, record {weekStart, total}
                lastAttempt: null
            };
        }

        // add this, newest, attempt
        const methodData = data[site].methods[method];
        methodData.total++;
        methodData.lastAttempt = now;
        // include this attempt in the current week's totals.
        const currentWeekStart = getWeekStart(now);
        let currentWeek = methodData.history.find(h => h.weekStart === currentWeekStart);
        if (!currentWeek) {
            // we do not yet have stats for this week. initialise
            currentWeek = { weekStart: currentWeekStart, count: 0 }
            methodData.history.push(currentWeek);
            // only keep the last 12 weeks
            if (methodData.history.length > 12) {
                methodData.history.shift();
            }
        }
        currentWeek.count++;
        // recalculate weekly average in case weeks changed
        const activeWeeks = methodData.history.filter(h => h.count > 0).length || 1;
        const totalInHistory = methodData.history.reduce((sum, h) => sum + h.count, 0);
        methodData.weeklyAverage = Math.round((totalInHistory / activeWeeks) * 10) / 10;

        // store changes
        data[site].lastUpdated = now;
        badger.getSettings().setItem("consealSiteStats", data);
    }).catch(err => {
        console.error("CONSEAL writeQueue error in statsController: ", err)
    });

    return writeQueue;
}

/**
 * for a given timestamp, get the timestamp of the start of the week
 * @param {*} timestamp 
 */
function getWeekStart(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
}

/**
 * get all tracking stats from Badger. use Promise so
 * we can await it
 */
async function getAllStats(badger) {
    if (!badger) { return {}; }
    return badger.getSettings().getItem("consealSiteStats") || {};
}

/**
 * function to get stats (incl. metrics) for a given site
 * @param {*} site 
 */
async function getSiteStats(badger, site) {
    const allStats = getAllStats(badger);
    if (!allStats[site]) { return null; }

    const stats = allStats[site];
    const enriched = {
        site,
        firstSeen: stats.firstSeen,
        lastUpdated: stats.lastUpdated,
        methods: {}
    };

    for (const [method, data] of Object.entries(stats.methods)) {
        enriched.methods[method] = {
            total: data.total,
            weeklyAverage: data.weeklyAverage,
            lastAttempt: data.lastAttempt,
            recentActivity: getRecentActivity(data.history, 4)
        };
    }

    return enriched;
}

function getRecentActivity(history, weeks) {
    const recent = history.slice(-weeks);
    return recent.map(h => ({
        week: new Date(h.weekStart).toISOString().split('T')[0],
        count: h.count
    }));
}

async function getTopTrackingSites(badger, limit = 10) {
    const allStats = getAllStats(badger);

    const sites = Object.entries(allStats).map(([site, data]) => {
        const methodStats = {};
        let grandTotal = 0;
        let highestWeeklyAvg = 0;

        for (const [method, mData] of Object.entries(data.methods)) {
            methodStats[method] = {
                total: mData.total,
                weeklyAverage: mData.weeklyAverage
            };
            grandTotal += mData.total;
            if (mData.weeklyAverage > highestWeeklyAvg) {
                highestWeeklyAvg = mData.weeklyAverage;
            }
        }

        return {
            site,
            grandTotal,
            highestWeeklyAvg,
            methodStats,
            firstSeen: data.firstSeen,
            lastUpdated: data.lastUpdated,
            riskScore: calculateRiskScore(grandTotal, highestWeeklyAvg, data.firstSeen)
        };
    });
    
    return sites
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, limit);
}

/**
 * caclculate a risk score for a website based on the 
 * frequency and persistence of tracking attempts
 * @param {*} total 
 * @param {*} weeklyAvg 
 * @param {*} firstSeen 
 */
function calculateRiskScore(total, weeklyAvg, firstSeen) {
    const weeksSinceFirst = (Date.now() - firstSeen) / MS_PER_WEEK;
    const persistenceFactor = Math.min(weeksSinceFirst / 4, 1); // cap at 4 weeks
    return (total * 0.3) + (weeklyAvg * 10) + (persistenceFactor * 20);
}

async function getGlobalSummary(badger) {
    const allStats = getAllStats(badger);
    const summary = {
        totalSites: Object.keys(allStats).length,
        totalAttempts: 0,
        methodBreakdown: {},
        topOffenders: []
    };

    for (const [site, data] of Object.entries(allStats)) {
        for (const [method, mData] of Object.entries(data.methods)) {
            summary.totalAttempts += mData.total;

            if (!summary.methodBreakdown[method]) {
                summary.methodBreakdown[method] = { total: 0, sites: 0 };
            }
            summary.methodBreakdown[method].total += mData.total;
            summary.methodBreakdown[method].sites++;
        }
    }

    return summary;
}

async function pruneOldData(badger, weeksToKeep = 12) {
    const data = await getAllStats(badger);
    const cutoff = Date.now() - (weeksToKeep * MS_PER_WEEK);
    let modified = false;

    for (const site in data) {
        for (const method in data[site].methods) {
            const history = data[site].methods[method].history;
            const originalLength = history.length;
            data[site].methods[method].history = history.filter(h => h.weekStart > cutoff);
            
            if (data[site].methods[method].history.length !== originalLength) {
                modified = true;
                const active = data[site].methods[method].history;
                const total = active.reduce((sum, h) => sum + h.count, 0);
                data[site].methods[method].weeklyAverage = active.length ?
                    Math.round((total / active.length) * 10) / 10 : 0;
            }
        }
    }

    if (modified) {
        chrome.runtime.sendMessage({
            type: 'setConsealSiteStats',
            stats: data
        });
    }
}

async function clearStats(badger, site) {
    if (site) {
        const data = getAllStats(badger);
        delete data[site];
        chrome.runtime.sendMessage({
            type: 'setConsealSiteStats',
            stats: data
        });
    } 
}

export default {
    recordAttempt,
    getAllStats,
    getSiteStats,
    getTopTrackingSites,
    getGlobalSummary,
    pruneOldData,
    clearStats
}