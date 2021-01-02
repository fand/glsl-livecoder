"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
const recorder_1 = require("./recorder");
const glslify = require("glslify-lite");
const prebuilt = require("glslang-validator-prebuilt");
class App {
    constructor(config) {
        this.view = null;
        this.glslangValidatorPath = prebuilt.path;
        this.lastShader = constants_1.INITIAL_SHADER;
        this.lastSoundShader = constants_1.INITIAL_SOUND_SHADER;
        this.osc = null;
        this.recorder = new recorder_1.default();
        this.onAnyChanges = ({ added }) => {
            if (added.glslangValidatorPath) {
                this.glslangValidatorPath = added.glslangValidatorPath;
            }
            if (added.server !== undefined) {
                if (this.player) {
                    this.player.command({ type: 'STOP' });
                }
                const rc = this.config.createRc();
                if (added.server) {
                    if (this.view !== null) {
                        this.view.destroy();
                    }
                    this.player = new player_server_1.default(added.server, {
                        rc,
                        isPlaying: this.state.isPlaying,
                        projectPath: this.config.projectPath,
                        lastShader: this.lastShader,
                    });
                }
                else {
                    this.view = new view_1.default(atom.workspace.element);
                    this.player = new player_1.default(this.view, rc, this.state.isPlaying, this.lastShader);
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
        this.onOsc = (data) => {
            this.player.command({ type: 'SET_OSC', data });
        };
        const rc = config.rc;
        this.view = new view_1.default(atom.workspace.getElement());
        this.player = new player_1.default(this.view, rc, false, this.lastShader);
        this.config = config;
        this.config.on('change', this.onChange);
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
        this.player.command({ type: 'PLAY' });
        this.config.play();
    }
    stop() {
        this.state.isPlaying = false;
        this.player.command({ type: 'STOP' });
        this.player.command({ type: 'STOP_SOUND' });
        this.config.stop();
        this.stopWatching();
        this.stopRecording();
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
            this.state.editorDisposer = undefined;
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
        this.loadSoundShader().then(() => this.player.command({ type: 'PLAY_SOUND' }));
    }
    stopSound() {
        this.player.command({ type: 'STOP_SOUND' });
    }
    loadLastShader() {
        if (!this.lastShader) {
            return;
        }
        this.player.command({ type: 'LOAD_SHADER', shader: this.lastShader });
    }
    loadLastSoundShader() {
        if (!this.lastSoundShader) {
            return;
        }
        this.player.command({
            type: 'LOAD_SOUND_SHADER',
            shader: this.lastSoundShader,
        });
    }
    stopWatching() {
        this.state.editor = undefined;
        if (this.state.activeEditorDisposer) {
            this.state.activeEditorDisposer.dispose();
            this.state.activeEditorDisposer = undefined;
        }
        if (this.state.editorDisposer) {
            this.state.editorDisposer.dispose();
            this.state.editorDisposer = undefined;
        }
    }
    createPasses(rcPasses, shader, postfix, dirname, useGlslify, isGLSL3) {
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
                GLSL3: isGLSL3
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
                    pass.vs = yield validator_1.loadFile(this.glslangValidatorPath, path.resolve(dirname, rcPass.vs), useGlslify);
                    if (i === lastPass &&
                        (postfix === '.frag' || postfix === '.fs')) {
                        pass.fs = shader;
                    }
                }
                if (rcPass.fs) {
                    pass.fs = yield validator_1.loadFile(this.glslangValidatorPath, path.resolve(dirname, rcPass.fs), useGlslify);
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
        return __awaiter(this, void 0, void 0, function* () {
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
            try {
                let headComment = (shader.match(/(?:\/\*)((?:.|\n|\r|\n\r)*?)(?:\*\/)/) || [])[1];
                headComment = headComment || '{}';
                let diff;
                if (isSound) {
                    diff = this.config.setSoundSettingsByString(filepath, headComment);
                }
                else {
                    diff = this.config.setFileSettingsByString(filepath, headComment);
                }
                const rc = diff.newConfig;
                this.onAnyChanges(diff);
                this.player.onChange(diff);
                if (rc.glslify) {
                    shader = yield glslify.compile(shader, {
                        basedir: path.dirname(filepath),
                    });
                }
                if (!isSound) {
                    yield validator_1.validator(this.glslangValidatorPath, shader, postfix);
                }
                let matcharray = (shader.split('\n')[0].match(/(#version 300 es)/) || []);
                let isGLSL3 = !!matcharray[0];
                const passes = yield this.createPasses(rc.PASSES, shader, postfix, dirname, rc.glslify, isGLSL3);
                if (isSound) {
                    this.lastSoundShader = shader;
                    return this.player.command({
                        type: 'LOAD_SOUND_SHADER',
                        shader,
                    });
                }
                else {
                    this.lastShader = passes;
                    return this.player.command({
                        type: 'LOAD_SHADER',
                        shader: passes,
                    });
                }
            }
            catch (e) {
                console.error(e);
            }
        });
    }
    toggleFullscreen() {
        this.player.command({ type: 'TOGGLE_FULLSCREEN' });
    }
    startRecording() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.view === null) {
                return;
            }
            const canvas = this.view.getCanvas();
            const fps = 60 / this.config.rc.frameskip;
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;
            const dst = this.config.projectPath;
            this.player.command({ type: 'START_RECORDING' });
            this.recorder.start(canvas, fps, width, height, dst);
        });
    }
    stopRecording() {
        return __awaiter(this, void 0, void 0, function* () {
            this.recorder.stop();
            this.player.command({ type: 'STOP_RECORDING' });
        });
    }
    setRecordingMode(mode) {
        this.recorder.setRecordingMode(mode);
    }
    insertTime() {
        this.player.query({ type: 'TIME' }).then((time) => {
            const editor = atom.workspace.getActiveTextEditor();
            if (editor) {
                editor.insertText(time.toString());
            }
        }, (err) => {
            console.error(err);
            atom.notifications.addError('[VEDA] Failed to get time.');
        });
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map