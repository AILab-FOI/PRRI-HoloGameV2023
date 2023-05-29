const DISCONNECT_SECONDS = 20

module.exports = class Player {
    constructor(clientHash, playerNumber) {
        this.clientHash = clientHash
        this.playerNumber = playerNumber
        this.disconnectTimer = null;
    }

    isInQueue(maxPlayers) {
      console.log("is this in queue", this.playerNumber);
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

    startDisconnectTimer(callback, socket) {
        if (this.disconnectTimer !== null) {
            clearTimeout(this.disconnectTimer)
        }
        this.disconnectTimer = setTimeout(() => {
            callback(this, socket)
        }, DISCONNECT_SECONDS * 1000);
    }
}