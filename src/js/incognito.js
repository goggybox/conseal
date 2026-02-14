
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

/* globals badger:false */

import utils from "./utils.js";

let tabs = {};

function updateTabStatus(tab_id, incognito) {
  tabs[tab_id] = !!incognito;
}

// Create tab event listeners
function onCreatedListener(tab) {
  tabs[tab.id] = tab.incognito;
}

function onRemovedListener(tab_id) {
  delete tabs[tab_id];
}

// Subscribe to tab events
function startListeners() {
  chrome.tabs.onCreated.addListener(onCreatedListener);
  chrome.tabs.onRemoved.addListener(onRemovedListener);
}

function learningEnabled(tab_id) {
  if (badger.getSettings().getItem("learnInIncognito")) {
    // treat all pages as if they're not incognito
    return true;
  }
  // if we don't have incognito data for whatever reason,
  // default to disabled
  if (!utils.hasOwn(tabs, tab_id)) {
    return false;
  }
  // else, do not learn in incognito tabs
  return !tabs[tab_id];
}

export default {
  learningEnabled,
  startListeners,
  updateTabStatus,
};
