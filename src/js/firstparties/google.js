
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

/* globals findInAllFrames:false, observeMutations:false */

let link_selector = [
  "a[href^='www.google.com/url?']",
  "a[href^='https://www.google.com/url?']",
  "a[href^='/url?q=']",
  `a[href^='${document.location.hostname}/url?']`,
].join(', ');

function cleanLink(a, norecurse) {
  if (!a.href.startsWith("https://www.google.com/url?") &&
    !a.href.startsWith(document.location.origin + "/url?")) {
    return;
  }

  let searchParams = (new URL(a.href)).searchParams,
    href = searchParams.get('url') || searchParams.get('q');

  if (!href || !window.isURL(href)) {
    return;
  }

  a.href = href;
  a.rel = "noreferrer noopener";

  // links could be double wrapped (`/mobilebasic` Google doc)
  if (!norecurse) {
    cleanLink(a, true);
  }
}

// TODO race condition; fix waiting on https://crbug.com/478183
chrome.runtime.sendMessage({
  type: "checkEnabled"
}, function (enabled) {
  if (!enabled) {
    return;
  }

  // clean already present links
  findInAllFrames(link_selector).forEach((link) => {
    cleanLink(link);
  });

  // clean dynamically added links
  observeMutations(link_selector, cleanLink);
});
