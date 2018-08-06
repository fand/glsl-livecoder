"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const view_1 = require("./view");
const validator_1 = require("./validator");
const player_1 = require("./player");
const player_server_1 = require("./player-server");
const constants_1 = require("./constants");
const osc_loader_1 = require("./osc-loader");
const glslify = require('glslify');
const glslifyImport = require('glslify-import');
class App {
    constructor(config) {
        this.lastShader = constants_1.INITIAL_SHADER;
        this.lastSoundShader = constants_1.INITIAL_SOUND_SHADER;
        this.osc = null;
        this.onAnyChanges = ({ added }) => {
            if (added.glslangValidatorPath) {
                this.glslangValidatorPath = added.glslangValidatorPath;
            }
            if (added.server !== undefined) {
                if (this.player) {
                    this.player.stop();
                }
                const rc = this.config.createRc();
                if (added.server) {
                    this.player = new player_server_1.default(added.server, {
                        rc,
                        isPlaying: this.state.isPlaying,
                        projectPath: this.config.projectPath,
                        lastShader: this.lastShader,
                    });
                }
                else {
                    const view = new view_1.default(atom.workspace.element, rc);
                    this.player = new player_1.default(view, rc, this.state.isPlaying, this.lastShader);
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
                    const oscLoader = new osc_loader_1.default(port);
                    this.osc = oscLoader;
                    oscLoader.on('message', this.onOsc);
                    oscLoader.on('reload', () => this.loadLastShader());
                }
            }
        };
        this.onChange = (rcDiff) => {
            this.onAnyChanges(rcDiff);
            this.player.onChange(rcDiff);
            this.loadLastShader();
            this.loadLastSoundShader();
        };
        this.onOsc = (msg) => {
            this.player.setOsc(msg.address, msg.args);
        };
        const rc = config.rc;
        const view = new view_1.default(atom.workspace.element, rc);
        this.player = new player_1.default(view, rc, false, this.lastShader);
        this.config = config;
        this.config.on('change', this.onChange);
        this.glslangValidatorPath = rc.glslangValidatorPath;
        this.state = {
            isPlaying: false,
        };
    }
    destroy() {
        this.player.destroy();
        if (this.osc) {
            this.osc.destroy();
        }
    }
    toggle() {
        return this.state.isPlaying ? this.stop() : this.play();
    }
    play() {
        this.state.isPlaying = true;
        this.player.play();
        this.config.play();
    }
    stop() {
        this.state.isPlaying = false;
        this.player.stop();
        this.player.stopSound();
        this.config.stop();
        this.stopWatching();
    }
    watchActiveShader() {
        if (this.state.activeEditorDisposer) {
            return;
        }
        this.watchShader();
        this.state.activeEditorDisposer = atom.workspace.onDidChangeActiveTextEditor(() => {
            this.watchShader();
        });
    }
    watchShader() {
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
    loadShader() {
        const editor = atom.workspace.getActiveTextEditor();
        this.loadShaderOfEditor(editor);
    }
    loadSoundShader() {
        const editor = atom.workspace.getActiveTextEditor();
        return this.loadShaderOfEditor(editor, true);
    }
    playSound() {
        this.loadSoundShader().then(() => this.player.playSound());
    }
    stopSound() {
        this.player.stopSound();
    }
    loadLastShader() {
        if (!this.lastShader) {
            return;
        }
        this.player.loadShader(this.lastShader);
    }
    loadLastSoundShader() {
        if (!this.lastSoundShader) {
            return;
        }
        this.player.loadSoundShader(this.lastSoundShader);
    }
    stopWatching() {
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
    createPasses(rcPasses, shader, postfix, dirname) {
        if (rcPasses.length === 0) {
            rcPasses.push({});
        }
        const lastPass = rcPasses.length - 1;
        return Promise.all(rcPasses.map((rcPass, i) => __awaiter(this, void 0, void 0, function* () {
            const pass = {
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
                }
                else {
                    pass.fs = shader;
                }
            }
            else {
                if (rcPass.vs) {
                    pass.vs = yield validator_1.loadFile(this.glslangValidatorPath, path.resolve(dirname, rcPass.vs));
                    if (i === lastPass &&
                        (postfix === '.frag' || postfix === '.fs')) {
                        pass.fs = shader;
                    }
                }
                if (rcPass.fs) {
                    pass.fs = yield validator_1.loadFile(this.glslangValidatorPath, path.resolve(dirname, rcPass.fs));
                    if (i === lastPass &&
                        (postfix === '.vert' || postfix === '.vs')) {
                        pass.vs = shader;
                    }
                }
            }
            return pass;
        })));
    }
    loadShaderOfEditor(editor, isSound) {
        if (editor === undefined) {
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
        let rc;
        return Promise.resolve()
            .then(() => {
            const headComment = (shader.match(/(?:\/\*)((?:.|\n|\r|\n\r)*?)(?:\*\/)/) || [])[1];
            let diff;
            if (isSound) {
                diff = this.config.setSoundSettingsByString(filepath, headComment);
            }
            else {
                diff = this.config.setFileSettingsByString(filepath, headComment);
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
                return validator_1.validator(this.glslangValidatorPath, shader, postfix);
            }
            return;
        })
            .then(() => this.createPasses(rc.PASSES, shader, postfix, dirname))
            .then(passes => {
            if (isSound) {
                this.lastSoundShader = shader;
                return this.player.loadSoundShader(shader);
            }
            else {
                this.lastShader = passes;
                return this.player.loadShader(passes);
            }
        })
            .catch(e => {
            console.error(e);
        });
    }
    toggleFullscreen() {
        this.player.toggleFullscreen();
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map