"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const atom_1 = require("atom");
const fs = require("fs");
const which = require("which");
const atom_message_panel_1 = require("atom-message-panel");
class Wrapper {
    constructor(state) {
        this.messages = null;
        console.log(state);
        this.config = new config_1.default(this.getProjectPath(atom), {
            pixelRatio: atom.config.get('veda.pixelRatio'),
            frameskip: atom.config.get('veda.frameskip'),
            vertexMode: atom.config.get('veda.vertexMode'),
            vertexCount: atom.config.get('veda.vertexCount'),
            glslangValidatorPath: atom.config.get('veda.glslangValidatorPath'),
            fftSize: atom.config.get('veda.fftSize'),
            fftSmoothingTimeConstant: atom.config.get('veda.fftSmoothingTimeConstant'),
        });
        this.app = new app_1.default(this.config);
        this.app.setRecordingMode(atom.config.get('veda.recordingMode'));
        atom.config.observe('veda.glslangValidatorPath', (x) => this.setGlslangValidatorPath(x));
        atom.config.observe('veda.pixelRatio', (x) => this.config.setGlobalSettings({ pixelRatio: x }));
        atom.config.observe('veda.frameskip', (x) => this.config.setGlobalSettings({ frameskip: x }));
        atom.config.observe('veda.vertexMode', (x) => this.config.setGlobalSettings({ vertexMode: x }));
        atom.config.observe('veda.vertexCount', (x) => this.config.setGlobalSettings({ vertexCount: x }));
        atom.config.observe('veda.fftSize', (x) => this.config.setGlobalSettings({ fftSize: x }));
        atom.config.observe('veda.fftSmoothingTimeConstant', (x) => this.config.setGlobalSettings({ fftSmoothingTimeConstant: x }));
        atom.config.observe('veda.recordingMode', (x) => this.app.setRecordingMode(x));
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'veda:toggle': () => this.app.toggle(),
            'veda:load-shader': () => this.app.loadShader(),
            'veda:watch-shader': () => this.app.watchShader(),
            'veda:watch-active-shader': () => this.app.watchActiveShader(),
            'veda:stop-watching': () => this.app.stopWatching(),
            'veda:load-sound-shader': () => this.app.playSound(),
            'veda:stop-sound-shader': () => this.app.stopSound(),
            'veda:toggle-fullscreen': () => this.app.toggleFullscreen(),
            'veda:start-recording': () => this.app.startRecording(),
            'veda:stop-recording': () => this.app.stopRecording(),
            'veda:insert-time': () => this.app.insertTime(),
        }));
        this.app.play();
    }
    destroy() {
        this.subscriptions.dispose();
        this.app.destroy();
    }
    showError(message) {
        if (!this.messages) {
            this.messages = new atom_message_panel_1.MessagePanelView({
                title: 'veda',
            });
            this.messages.attach();
            this.messages.toggle();
        }
        this.messages.clear();
        this.messages.add(new atom_message_panel_1.PlainMessageView({
            message,
            className: 'text-error',
        }));
    }
    hideError() {
        if (this.messages) {
            this.messages.close();
            this.messages = null;
        }
    }
    checkExistence(path) {
        let result = null;
        if (fs.existsSync(path) && fs.statSync(path).isFile()) {
            try {
                fs.accessSync(path, fs.X_OK);
                result = path;
            }
            catch (error) {
                console.log(error);
            }
        }
        else {
            try {
                result = which.sync(path);
            }
            catch (error) {
                console.log(error);
            }
        }
        return result;
    }
    setGlslangValidatorPath(glslangValidatorPath) {
        if (!glslangValidatorPath) {
            return;
        }
        const result = this.checkExistence(glslangValidatorPath);
        if (result) {
            this.hideError();
            this.config.setGlobalSettings({ glslangValidatorPath: result });
        }
        else {
            this.showError(`Unable to locate glslangValidator at '${glslangValidatorPath}'`);
        }
    }
    getProjectPath(atom) {
        const projectPaths = atom.project.getPaths();
        if (projectPaths.length === 0) {
            atom.notifications.addError('[VEDA] No projects found in this window');
            throw new Error('[VEDA] No projects found in this window');
        }
        if (projectPaths.length > 1) {
            atom.notifications.addWarning('[VEDA] There are more than 1 project in this window. <br>veda only recognizes the 1st project.');
        }
        return projectPaths[0];
    }
}
exports.default = Wrapper;
//# sourceMappingURL=wrapper.js.map