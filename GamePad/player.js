const DISCONNECT_SECONDS = 5

module.exports = class Player {
    constructor(clientHash, playerNumber) {
        this.clientHash = clientHash
        this.playerNumber = playerNumber
        this.lastPressedControl
        this.disconnectTimer = null;
    }

    isInQueue(maxPlayers) {
        return this.playerNumber < maxPlayers;
    }

    getNumber() {
        return this.playerNumber;
    }

    getHash() {
        return this.clientHash;
    }

    moveForwardInQueue() {
        this.playerNumber--;
    }

    startDisconnectTimer(callback) {
        if (this.disconnectTimer !== null) {
            clearTimeout(this.disconnectTimer)
        }
        this.disconnectTimer = setTimeout(() => {
            callback(this)
        }, DISCONNECT_SECONDS * 1000);
    }
}