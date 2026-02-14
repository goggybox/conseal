
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

(function () {
    var noopfn = function() {
        ;
    };
    function YqClass() {
        this.observe = noopfn;
        this.observeMin = noopfn;
        this.scroll_event = noopfn;
        this.onready = noopfn;
        this.yq_panel_click = noopfn;
        this.titleTrim = noopfn;
    }
    window.Yq || (window.Yq = new YqClass); // eslint-disable-line no-unused-expressions
}());
