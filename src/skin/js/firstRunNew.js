
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

window.addEventListener("load", () => {
    const cat = document.getElementById("goggy-cat");
    const text = document.getElementById("goggy-text");

    cat.addEventListener("mouseenter", () => {
        text.classList.remove("hidden");
        console.log("HEY");
    });

    cat.addEventListener("mouseleave", () => {
        text.classList.add("hidden");
    });

    
});