"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const io = require("socket.io-client");
const player_1 = require("./player");
const view_1 = require("./view");
class PlayerClient {
    constructor() {
        this.player = null;
        this.wrapper = document.body;
        this.timer = null;
        this.poll = () => {
            this.socket.emit('ready');
            this.timer = window.setTimeout(this.poll, 1000);
        };
        this.socket = io({
            autoConnect: false,
        });
        this.socket.on('create', ({ rc, isPlaying, lastShader }) => {
            if (this.timer) {
                clearTimeout(this.timer);
            }
            if (!this.player) {
                const view = new view_1.default(this.wrapper);
                this.player = new player_1.default(view, rc, isPlaying, lastShader);
            }
        });
        this.socket.on('destroy', () => {
            this.player && this.player.destroy();
        });
        this.socket.on('onChange', (rcDiff) => {
            this.player && this.player.onChange(rcDiff);
        });
        this.socket.on('command', (command) => {
            this.player && this.player.command(command);
        });
        this.socket.on('query', (query, callback) => {
            if (!this.player) {
                return callback('[VEDA] Player is not initialized.');
            }
            this.player
                .query(query)
                .then((value) => callback(null, value), callback);
        });
        this.socket.on('connect', () => {
            console.log('[VEDA] Connected to the server');
            this.poll();
        });
        this.socket.on('disconnect', () => {
            console.log('[VEDA] Disconnected');
        });
    }
    connect() {
        this.socket.open();
    }
}
exports.default = PlayerClient;
//# sourceMappingURL=player-client.js.map