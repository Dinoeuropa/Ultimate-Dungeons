namespace parentFrame {
    export function sendMessage(channel: string, message: string) {
        if (message == null) return
        const msgBuffer = Buffer.fromUTF8(message)
        control.simmessages.send(channel, msgBuffer, true)
    }

    export function onReceiveMessage(channel: string, handler: (message: string) => void) {
        control.simmessages.onReceived(channel, buf => {
            handler(buf.toString())
        })
    }
}

namespace mobileBridge {
    const CHANNEL = "mobile"
    let difficulty = 1
    let paused = false
    let regenMultiplier = 1
    let lastStateSent = 0

    export function getDifficulty() {
        return difficulty
    }

    export function isPaused() {
        return paused
    }

    export function sendState() {
        if (!mySprite || !statusbar8 || !statusbar9) return
        const payload = JSON.stringify({
            action: "state",
            floor: bossLevelCounter,
            score: info.score(),
            highScore: info.highScore(),
            hp: statusbar9.value,
            maxHp: statusbar9.max,
            stamina: statusbar8.value,
            maxStamina: statusbar8.max,
            inGame: inGame,
            paused: paused,
            difficulty: difficulty
        })
        parentFrame.sendMessage(CHANNEL, payload)
    }

    export function init() {
        parentFrame.onReceiveMessage(CHANNEL, (message: string) => {
            let data: any = {}
            try {
                data = JSON.parse(message)
            } catch (e) {
                return
            }

            if (data.action === "pause") {
                paused = true
                if (mySprite) {
                    mySprite.setVelocity(0, 0)
                }
            } else if (data.action === "resume") {
                paused = false
            } else if (data.action === "setDifficulty") {
                difficulty = data.value
                if (difficulty === 0) {
                    regenMultiplier = 2
                } else if (difficulty === 2) {
                    regenMultiplier = 0.5
                } else {
                    regenMultiplier = 1
                }
            } else if (data.action === "requestState") {
                sendState()
            } else if (data.action === "loadSave") {
                if (data.score != null) {
                    info.setScore(data.score)
                }
            }
        })

        game.onUpdateInterval(200, function () {
            if (paused && mySprite) {
                mySprite.setVelocity(0, 0)
            }
            if (reCharge == 1 && regenMultiplier > 1 && statusbar8 && statusbar8.value < statusbar8.max) {
                statusbar8.value += 1
            }
        })

        game.onUpdateInterval(1000, function () {
            const now = control.millis()
            if (now - lastStateSent > 900) {
                lastStateSent = now
                sendState()
            }
        })
    }
}

mobileBridge.init()
