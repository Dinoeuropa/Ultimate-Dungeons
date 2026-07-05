/**
 * Mobile control bridge for Ultimate Dungeons.
 * Handles touch controls from the parent shell and relays game state upward.
 */
(function () {
    var simReady = false;
    var simOrigin = "*";
    var pressedKeys = {};
    var MOBILE_CHANNEL = "mobile";

    var KEY_MAP = {
        up: { key: "ArrowUp", keyCode: 38 },
        down: { key: "ArrowDown", keyCode: 40 },
        left: { key: "ArrowLeft", keyCode: 37 },
        right: { key: "ArrowRight", keyCode: 39 },
        a: { key: "a", keyCode: 65 },
        b: { key: "s", keyCode: 83 }
    };

    window.addEventListener("message", onParentMessage, false);
    window.addEventListener("message", onSimMessage, false);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initMobileShell);
    } else {
        initMobileShell();
    }

    function initMobileShell() {
        document.body.classList.add("mobile-game-shell");
        injectStyles();
        notifyParent({ type: "game-shell-ready" });
    }

    function onParentMessage(ev) {
        var data = ev.data || {};
        if (data.type === "game-control") {
            handleControl(data);
        } else if (data.type === "game-command") {
            handleCommand(data);
        }
    }

    function onSimMessage(ev) {
        var data = ev.data || {};
        if (data.type === "ready") {
            simReady = true;
            hideDefaultControls();
            notifyParent({ type: "game-ready" });
            return;
        }
        if (data.type === "messagepacket" && data.channel === MOBILE_CHANNEL) {
            try {
                var payload = JSON.parse(bytesToString(data.data));
                notifyParent({ type: "game-state", payload: payload });
            } catch (e) {
                // ignore malformed payloads
            }
        }
    }

    function handleControl(data) {
        var mapping = KEY_MAP[data.button];
        if (!mapping) return;

        if (data.button === "block") {
            setKey("a", !!data.pressed);
            setKey("b", !!data.pressed);
            return;
        }

        setKey(data.button, !!data.pressed);
    }

    function handleCommand(data) {
        if (!simReady) return;
        if (data.command === "pause") {
            sendToGame(MOBILE_CHANNEL, JSON.stringify({ action: "pause" }));
        } else if (data.command === "resume") {
            sendToGame(MOBILE_CHANNEL, JSON.stringify({ action: "resume" }));
        } else if (data.command === "setDifficulty") {
            sendToGame(MOBILE_CHANNEL, JSON.stringify({
                action: "setDifficulty",
                value: data.value
            }));
        } else if (data.command === "requestState") {
            sendToGame(MOBILE_CHANNEL, JSON.stringify({ action: "requestState" }));
        } else if (data.command === "restart") {
            var frame = document.getElementById("simframe");
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage({ type: "simulator", command: "restart" }, simOrigin);
            }
        }
    }

    function setKey(button, pressed) {
        var mapping = KEY_MAP[button];
        if (!mapping) return;

        var frame = document.getElementById("simframe");
        if (!simReady || !frame || !frame.contentWindow) return;

        if (pressed && !pressedKeys[button]) {
            pressedKeys[button] = true;
            postKey(mapping, true);
        } else if (!pressed && pressedKeys[button]) {
            pressedKeys[button] = false;
            postKey(mapping, false);
        }
    }

    function postKey(mapping, pressed) {
        var frame = document.getElementById("simframe");
        if (!frame || !frame.contentWindow) return;

        frame.contentWindow.postMessage({
            type: "key",
            key: mapping.key,
            keyCode: mapping.keyCode,
            pressed: pressed,
            event: pressed ? "keydown" : "keyup"
        }, simOrigin);
    }

    function sendToGame(channel, text) {
        var frame = document.getElementById("simframe");
        if (!simReady || !frame || !frame.contentWindow) return false;

        frame.contentWindow.postMessage({
            type: "messagepacket",
            broadcast: false,
            channel: channel,
            data: stringToBytes(text)
        }, simOrigin);

        return true;
    }

    function hideDefaultControls() {
        var frame = document.getElementById("simframe");
        if (!frame || !frame.contentWindow) return;

        frame.contentWindow.postMessage({
            type: "setcontrolvisibility",
            visible: false
        }, simOrigin);
    }

    function notifyParent(payload) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, "*");
        }
    }

    function bytesToString(bytes) {
        if (!bytes) return "";
        if (typeof TextDecoder !== "undefined") {
            return new TextDecoder("utf-8").decode(bytes);
        }
        var result = "";
        for (var i = 0; i < bytes.length; i++) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    }

    function stringToBytes(text) {
        if (typeof TextEncoder !== "undefined") {
            return new TextEncoder().encode(text);
        }
        var bytes = new Uint8Array(text.length);
        for (var i = 0; i < text.length; i++) {
            bytes[i] = text.charCodeAt(i) & 0xff;
        }
        return bytes;
    }

    function injectStyles() {
        var style = document.createElement("style");
        style.textContent = [
            "body.mobile-game-shell {",
            "  background: #0b0612;",
            "  margin: 0;",
            "  overflow: hidden;",
            "}",
            "body.mobile-game-shell iframe#simframe {",
            "  image-rendering: pixelated;",
            "  image-rendering: crisp-edges;",
            "}",
            "body.mobile-game-shell #fullscreen,",
            "body.mobile-game-shell #loader {",
            "  display: none;",
            "}"
        ].join("\n");
        document.head.appendChild(style);
    }

    window.ultimateDungeonsBridge = {
        sendToGame: sendToGame,
        notifyParent: notifyParent,
        isReady: function () { return simReady; }
    };
})();
