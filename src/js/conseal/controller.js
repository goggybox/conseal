import { log } from "../bootstrap.js";

let badger;

function init(data) {
    log("CONSEAL: Initialised Conseal");
    badger = data["badger"];
};

/**
 * function to handle first-party requests
 * intercepted by Privacy Badger.
 * @param {*} ctx data from web request
 */
function handle(ctx) {
    if (!badger) { return; }

    console.log("HANDLING FIRST-PARTY REQUEST");

}


/**
 * get protection level from Badger storage
 */
function getProtectionLevel() {
    return badger.getSettings().getItem("protectionLevel");
}

function setProtectionLevel(new_level) {
    return badger.getSettings().setItem("protectionLevel", new_level);
}


export default {
    init,
    handle,
    getProtectionLevel,
    setProtectionLevel
};