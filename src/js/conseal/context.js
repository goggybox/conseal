/**
 * defines data structure conseal expects from
 * privacy badger's webrequest.js.
 */

import utils from "../utils.js";

export function buildContext(details, pb) {
    const {
        tabId,
        frameId,
        tabHost,
        requestHost,
        swRequest,
        fromCurrentTab,
        frameData
    } = pb;

    const type = details.type;

    return Object.freeze({
        tabId,
        frameId,
        url: details.url,
        method: details.method,
        type,
        tabHost,
        requestHost,
        isFirstParty: !utils.isThirdPartyDomain(requestHost,tabHost),
        isThirdParty: utils.isThirdPartyDomain(requestHost, tabHost),
        isMainFrame: type === "main_frame",
        isSubFrame: type === "sub_frame",
        isServiceWorker: swRequest,
        fromCurrentTab,
        initiatorUrl: frameData?.url ?? null,
        timestamp: details.timeStamp
    });
}

