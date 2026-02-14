
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

// https://github.com/gorhill/uBlock/blob/dcc72ba51c30abd4a1216049cc34f6c429ab2090/src/web_accessible_resources/scorecardresearch_beacon.js
(function() {
    'use strict';
    window.COMSCORE = {
        purge: function() {
            window._comscore = [];
        },
        beacon: function() {
        }
    };
})();
