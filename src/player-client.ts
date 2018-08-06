import * as io from 'socket.io-client';
import Player from './player';
import View from './view';
import { IRc, IRcDiff } from './config';
import { IShader } from './constants';

interface IOscChunk {
    name: string;
    data: number[];
}

interface ICreateOpts {
    rc: IRc;
    isPlaying: boolean;
    lastShader: IShader;
}

export default class PlayerClient {
    private socket: any;
    private player: Player | null = null;
    private wrapper: any = document.body;
    private timer: number | null = null;

    constructor() {
        this.socket = io({
            autoConnect: false,
        });

        this.socket.on(
            'create',
            ({ rc, isPlaying, lastShader }: ICreateOpts) => {
                if (this.timer) {
                    clearTimeout(this.timer);
                }
                if (!this.player) {
                    const view = new View(this.wrapper, rc);
                    this.player = new Player(view, rc, isPlaying, lastShader);
                }
            },
        );
        this.socket.on('destroy', () => {
            this.player && this.player.destroy();
        });
        this.socket.on('onChange', (rcDiff: IRcDiff) => {
            this.player && this.player.onChange(rcDiff);
        });
        this.socket.on('play', () => this.player && this.player.play());
        this.socket.on('stop', () => this.player && this.player.stop());
        this.socket.on('loadShader', (shader: IShader) => {
            console.log('[VEDA] Updated shader', shader);
            this.player && this.player.loadShader(shader);
        });
        this.socket.on('loadSoundShader', (shader: string) => {
            this.player && this.player.loadSoundShader(shader);
        });
        this.socket.on(
            'playSound',
            () => this.player && this.player.playSound(),
        );
        this.socket.on(
            'stopSound',
            () => this.player && this.player.stopSound(),
        );
        this.socket.on('setOsc', (msg: IOscChunk) => {
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

    poll = () => {
        this.socket.emit('ready');
        this.timer = window.setTimeout(this.poll, 1000);
    };
}
