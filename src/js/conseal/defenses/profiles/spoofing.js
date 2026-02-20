
// --------------------------------------------------------------------
// This file is part of Conseal <https://conse.al/>.
// Copyright (C) 2026 goggybox <https://github.com/goggybox>
// Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

// Please keep this header comment in all copies of the program.
// --------------------------------------------------------------------

// This file is adapted from sereneblue's Chameleon.
// Copyright (C) sereneblue <https://github.com/sereneblue/chameleon>
// --------------------------------------------------------------------

export function generateSpoofingCode(profile) {
    return `
        (function() {
            if (window.__consealProfileApplied) return;
            window.__consealProfileApplied = true;

            const profile = ${JSON.stringify(profile)};

            if (profile.navigator) {
                const nav = profile.navigator;
                
                if (nav.platform) {
                    Object.defineProperty(navigator, 'platform', {
                        configurable: true,
                        value: nav.platform
                    });
                }
                if (nav.userAgent) {
                    Object.defineProperty(navigator, 'userAgent', {
                        configurable: true,
                        value: nav.userAgent
                    });
                }
                // ... all other properties
            }

            if (profile.screen && window.screen) {
                const scr = profile.screen;
                const screenProxy = new Proxy(window.screen, {
                    get(target, prop) {
                        if (prop === 'width' && scr.width !== undefined) return scr.width;
                        if (prop === 'height' && scr.height !== undefined) return scr.height;
                        if (prop === 'availWidth' && scr.availWidth !== undefined) return scr.availWidth;
                        if (prop === 'availHeight' && scr.availHeight !== undefined) return scr.availHeight;
                        if (prop === 'colorDepth' && scr.colorDepth !== undefined) return scr.colorDepth;
                        if (prop === 'pixelDepth' && scr.pixelDepth !== undefined) return scr.pixelDepth;
                        return Reflect.get(target, prop);
                    }
                });
                
                try {
                    Object.defineProperty(window, 'screen', {
                        configurable: true,
                        value: screenProxy
                    });
                } catch (e) {
                    console.log('CONSEAL: Failed to override window.screen:', e);
                }
            }

            console.log('CONSEAL: Profile applied - platform:', profile.navigator?.platform);
        })();
    `;
}