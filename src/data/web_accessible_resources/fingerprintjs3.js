
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

// https://github.com/gorhill/uBlock/blob/e9fb4c3a426eb3231976f40c419ccd1a693fa559/src/web_accessible_resources/fingerprint3.js
(function() {
    'use strict';
    const visitorId = (( ) => {
        let id = '';
        for ( let i = 0; i < 8; i++ ) {
            id += (Math.random() * 0x10000 + 0x1000 | 0).toString(16).slice(-4);
        }
        return id;
    })();
    const FingerprintJS = class {
        static hashComponents() {
            return visitorId;
        }
        static load() {
            return Promise.resolve(new FingerprintJS());
        }
        get() {
            return Promise.resolve({
                visitorId,
            });
        }
    };
    window.FingerprintJS = FingerprintJS;
})();
