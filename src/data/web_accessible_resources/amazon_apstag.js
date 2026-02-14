
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

// https://github.com/gorhill/uBlock/blob/a78bb0f8eb4a9c419bcafedba5a4e843232a16be/src/web_accessible_resources/amazon_apstag.js
(function() {
    'use strict';
    const w = window;
    const noopfn = function() {
        ; // jshint ignore:line
    }.bind();
    const _Q = w.apstag && w.apstag._Q || [];
    const apstag = {
        _Q,
        fetchBids: function(a, b) {
            if ( typeof b === 'function' ) {
                b([]);
            }
        },
        init: noopfn,
        setDisplayBids: noopfn,
        targetingKeys: noopfn,
    };
    w.apstag = apstag;
    _Q.push = function(prefix, args) {
        try {
            switch (prefix) {
            case 'f':
                apstag.fetchBids(...args);
                break;
            }
        } catch (e) {
            console.trace(e);
        }
    };
    for ( const cmd of _Q ) {
        _Q.push(cmd);
    }
})();
