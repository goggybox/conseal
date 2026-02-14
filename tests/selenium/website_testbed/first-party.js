
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

function setExpire() {
	var now = new Date();
	var time = now.getTime();
	var expireTime = time + 864000;
	now.setTime(expireTime);
	return ";expires=" + now.toGMTString();
}

function setPath() {
	return ";path=/";
}

function setSameSite() {
	return ";SameSite=None;Secure";
}

function updateCookie() {
	var oldcookie = document.cookie;
	var val = "1234567890";
	console.log("read cookie: " + oldcookie);
	document.cookie = "localtest=" + encodeURIComponent(val) + setExpire() + setPath() + setSameSite();
	console.log("updating cookie to:" + document.cookie);
}

updateCookie();
