/**
 * ADAPTED FROM audiocontext-scrambler.
 * SOURCE: https://github.com/Sayrus/audiocontext-scrambler
 */

(function () {
    console.log("[CONSEAL][audio] scrambler loaded", location.href);
    function createCustomChannelData(target) {
        if (!target || !target.prototype?.getChannelData) return;

        const original = target.prototype.getChannelData;
        let buffer = null;

        function getChannelData() {
            const originalResult = original.apply(this, arguments);
            if (buffer !== originalResult) {
                buffer = originalResult;
                for (let i = 0; i < originalResult.length; i += 100) {
                    let index = Math.floor(Math.random() * i);
                    originalResult[index] = originalResult[index] + Math.random() * 0.0000001;
                }
            }
            return originalResult;
        };
        exportFunction(getChannelData, target.prototype, {
            defineAs:'getChannelData'
        });
    }

    function createCustomAnalyserNode(target) {
        if (!target || !target.prototype?.getFloatFrequencyData) return;
        const original = target.prototype.getFloatFrequencyData;
        function getFloatFrequencyData() {
            const result = original.apply(this, arguments);
            const data = arguments[0];
            for (let i = 0; i < data.length; i += 100) {
                const index = Math.floor(Math.random() * i);
                data[index] += Math.random() * 0.1;
            }
            return result;
        };
        exportFunction(getFloatFrequencyData, target.prototype, {
            defineAs:'getFloatFrequencyData'
        });
    }

    createCustomChannelData(window.AudioBuffer);
    createCustomChannelData(window.OfflineAudioContext);
    createCustomAnalyserNode(window.AnalyserNode);
})();