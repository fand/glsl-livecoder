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
                const view = new view_1.default(this.wrapper, rc);
                this.player = new player_1.default(view, rc, isPlaying, lastShader);
            }
        });
        this.socket.on('destroy', () => {
            this.player && this.player.destroy();
        });
        this.socket.on('onChange', (rcDiff) => {
            this.player && this.player.onChange(rcDiff);
        });
        this.socket.on('play', () => this.player && this.player.play());
        this.socket.on('stop', () => this.player && this.player.stop());
        this.socket.on('loadShader', (shader) => {
            console.log('[VEDA] Updated shader', shader);
            this.player && this.player.loadShader(shader);
        });
        this.socket.on('loadSoundShader', (shader) => {
            this.player && this.player.loadSoundShader(shader);
        });
        this.socket.on('playSound', () => this.player && this.player.playSound());
        this.socket.on('stopSound', () => this.player && this.player.stopSound());
        this.socket.on('setOsc', (msg) => {
            if (this.player) {
                this.player.setOsc(msg.name, msg.data);
            }
        });
        this.socket.on('toggleFullscreen', () => {
            this.player && this.player.toggleFullscreen();
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