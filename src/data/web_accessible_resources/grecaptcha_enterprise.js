
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

(function () {

    let script_src = document.currentScript.src;

    window.grecaptcha = {};

    window.grecaptcha.enterprise = {
        ready: function (cb) {
            cb();
        },
        render: function (container) {
            if (Object.prototype.toString.call(container) != "[object String]") {
                if (!container.id) {
                    container.id = "grecaptcha-" + Math.random().toString().replace(".", "");
                }
                container = container.id;
            }
            document.dispatchEvent(new CustomEvent("pbSurrogateMessage", {
                detail: {
                    type: "widgetFromSurrogate",
                    name: "Google reCAPTCHA",
                    widgetData: {
                        domId: container,
                        scriptUrl: script_src
                    }
                }
            }));
        },
        execute: function () {}
    };

    let onload = (new URL(script_src)).searchParams.get('onload');
    if (onload && onload in window) {
        window[onload]();
    }

}());
