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