import { TextEditor } from 'atom';
import * as path from 'path';
import View from './view';
import { validator, loadFile } from './validator';
import { IShader, ISoundShader } from './constants';
import Config, { IRc, IRcDiff } from './config';
import { IPlayable } from './playable';
import Player from './player';
import PlayerServer from './player-server';
import { INITIAL_SHADER, INITIAL_SOUND_SHADER } from './constants';
import OscLoader from './osc-loader';

const glslify = require('glslify');
const glslifyImport = require('glslify-import');

interface IAppState {
    isPlaying: boolean;
    activeEditorDisposer?: any;
    editorDisposer?: any;
    editor?: TextEditor;
}

export default class App {
    private player: IPlayable;
    private state: IAppState;
    private glslangValidatorPath: string;
    private lastShader: IShader = INITIAL_SHADER;
    private lastSoundShader: ISoundShader = INITIAL_SOUND_SHADER;
    private osc: OscLoader | null = null;

    private config: Config;

    constructor(config: Config) {
        const rc = config.rc;
        const view = new View((atom.workspace as any).element, rc);
        this.player = new Player(view, rc, false, this.lastShader);

        this.config = config;
        this.config.on('change', this.onChange);

        this.glslangValidatorPath = rc.glslangValidatorPath;

        this.state = {
            isPlaying: false,
        };
    }

    destroy(): void {
        this.player.destroy();
        if (this.osc) {
            this.osc.destroy();
        }
    }

    private onAnyChanges = ({ added }: IRcDiff) => {
        if (added.glslangValidatorPath) {
            this.glslangValidatorPath = added.glslangValidatorPath;
        }

        if (added.server !== undefined) {
            if (this.player) {
                this.player.stop();
            }

            const rc = this.config.createRc();

            if (added.server) {
                this.player = new PlayerServer(added.server, {
                    rc,
                    isPlaying: this.state.isPlaying,
                    projectPath: this.config.projectPath,
                    lastShader: this.lastShader,
                });
            } else {
                const view = new View((atom.workspace as any).element, rc);
                this.player = new Player(
                    view,
                    rc,
                    this.state.isPlaying,
                    this.lastShader,
                );
            }
        }

        if (added.osc !== undefined) {
            const port = added.osc;
            const osc = this.osc;
            if (osc && (!port || osc.port !== parseInt(port.toString(), 10))) {
                osc.destroy();
                this.osc = null;
            }
            if (port && !this.osc) {
                const oscLoader = new OscLoader(port);
                this.osc = oscLoader;
                oscLoader.on('message', this.onOsc);
                oscLoader.on('reload', () => this.loadLastShader());
            }
        }
    };

    private onChange = (rcDiff: IRcDiff) => {
        this.onAnyChanges(rcDiff);
        this.player.onChange(rcDiff);
        this.loadLastShader();
        this.loadLastSoundShader();
    };

    onOsc = (msg: { address: string; args: number[] }) => {
        this.player.setOsc(msg.address, msg.args);
    };

    toggle(): void {
        return this.state.isPlaying ? this.stop() : this.play();
    }

    play(): void {
        this.state.isPlaying = true;
        this.player.play();
        this.config.play();
    }

    stop(): void {
        this.state.isPlaying = false;
        this.player.stop();
        this.player.stopSound();
        this.config.stop();
        this.stopWatching();
    }

    watchActiveShader(): void {
        if (this.state.activeEditorDisposer) {
            return;
        }

        this.watchShader();
        this.state.activeEditorDisposer = atom.workspace.onDidChangeActiveTextEditor(
            () => {
                this.watchShader();
            },
        );
    }

    watchShader(): void {
        if (this.state.editorDisposer) {
            this.state.editorDisposer.dispose();
            this.state.editorDisposer = null;
        }

        const editor = atom.workspace.getActiveTextEditor();
        this.state.editor = editor;
        this.loadShaderOfEditor(editor);

        if (editor !== undefined) {
            this.state.editorDisposer = editor.onDidStopChanging(() => {
                this.loadShaderOfEditor(editor);
            });
        }
    }

    loadShader(): void {
        const editor = atom.workspace.getActiveTextEditor();
        this.loadShaderOfEditor(editor);
    }

    loadSoundShader(): Promise<void> {
        const editor = atom.workspace.getActiveTextEditor();
        return this.loadShaderOfEditor(editor, true);
    }

    playSound(): void {
        this.loadSoundShader().then(() => this.player.playSound());
    }

    stopSound(): void {
        this.player.stopSound();
    }

    private loadLastShader(): void {
        if (!this.lastShader) {
            return;
        }
        this.player.loadShader(this.lastShader);
    }

    private loadLastSoundShader(): void {
        if (!this.lastSoundShader) {
            return;
        }
        this.player.loadSoundShader(this.lastSoundShader);
    }

    stopWatching(): void {
        this.state.editor = undefined;
        if (this.state.activeEditorDisposer) {
            this.state.activeEditorDisposer.dispose();
            this.state.activeEditorDisposer = null;
        }
        if (this.state.editorDisposer) {
            this.state.editorDisposer.dispose();
            this.state.editorDisposer = null;
        }
    }

    private createPasses(
        rcPasses: any,
        shader: string,
        postfix: string,
        dirname: string,
    ): Promise<any[]> {
        if (rcPasses.length === 0) {
            rcPasses.push({});
        }

        const lastPass = rcPasses.length - 1;

        return Promise.all(
            rcPasses.map(async (rcPass: any, i: number) => {
                const pass: any = {
                    MODEL: rcPass.MODEL,
                    TARGET: rcPass.TARGET,
                    FLOAT: rcPass.FLOAT,
                    WIDTH: rcPass.WIDTH,
                    HEIGHT: rcPass.HEIGHT,
                    BLEND: rcPass.BLEND,
                };

                if (!rcPass.fs && !rcPass.vs) {
                    if (postfix === '.vert' || postfix === '.vs') {
                        pass.vs = shader;
                    } else {
                        pass.fs = shader;
                    }
                } else {
                    if (rcPass.vs) {
                        pass.vs = await loadFile(
                            this.glslangValidatorPath,
                            path.resolve(dirname, rcPass.vs),
                        );
                        if (
                            i === lastPass &&
                            (postfix === '.frag' || postfix === '.fs')
                        ) {
                            pass.fs = shader;
                        }
                    }
                    if (rcPass.fs) {
                        pass.fs = await loadFile(
                            this.glslangValidatorPath,
                            path.resolve(dirname, rcPass.fs),
                        );
                        if (
                            i === lastPass &&
                            (postfix === '.vert' || postfix === '.vs')
                        ) {
                            pass.vs = shader;
                        }
                    }
                }

                return pass;
            }),
        );
    }

    private loadShaderOfEditor(
        editor?: TextEditor,
        isSound?: boolean,
    ): Promise<void> {
        if (editor === undefined) {
            // This case occurs when no files are open/active
            return Promise.resolve();
        }
        const filepath = editor.getPath();
        if (filepath === undefined) {
            return Promise.resolve();
        }

        const dirname = path.dirname(filepath);

        const m = (filepath || '').match(/(\.(?:glsl|frag|vert|fs|vs))$/);
        if (!m) {
            console.error("The filename for current doesn't seems to be GLSL.");
            return Promise.resolve();
        }
        const postfix = m[1];

        let shader = editor.getText();

        let rc: IRc;
        return Promise.resolve()
            .then(() => {
                const headComment = (shader.match(
                    /(?:\/\*)((?:.|\n|\r|\n\r)*?)(?:\*\/)/,
                ) || [])[1];

                let diff;
                if (isSound) {
                    diff = this.config.setSoundSettingsByString(
                        filepath,
                        headComment,
                    );
                } else {
                    diff = this.config.setFileSettingsByString(
                        filepath,
                        headComment,
                    );
                }

                rc = diff.newConfig;
                this.onAnyChanges(diff);
                return this.player.onChange(diff);
            })
            .then(() => {
                if (rc.glslify) {
                    shader = glslify(shader, {
                        basedir: path.dirname(filepath),
                        transform: [glslifyImport],
                    });
                }
            })
            .then(() => {
                if (!isSound) {
                    return validator(
                        this.glslangValidatorPath,
                        shader,
                        postfix,
                    );
                }
                return;
            })
            .then(() => this.createPasses(rc.PASSES, shader, postfix, dirname))
            .then(passes => {
                if (isSound) {
                    this.lastSoundShader = shader;
                    return this.player.loadSoundShader(shader);
                } else {
                    this.lastShader = passes;
                    return this.player.loadShader(passes);
                }
            })
            .catch(e => {
                console.error(e);
            });
    }

    toggleFullscreen(): void {
        this.player.toggleFullscreen();
    }
}
