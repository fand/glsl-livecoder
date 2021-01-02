"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");
const p = require("pify");
const lodash_1 = require("lodash");
const DEFAULT_RC = {
    glslangValidatorPath: '',
    IMPORTED: {},
    PASSES: [],
    pixelRatio: 2,
    frameskip: 2,
    vertexMode: 'LINE_STRIP',
    vertexCount: 3000,
    fftSize: 2048,
    fftSmoothingTimeConstant: 0.8,
    audio: false,
    midi: false,
    keyboard: false,
    gamepad: false,
    camera: false,
    glslify: false,
    server: null,
    osc: null,
    soundLength: 30,
};
function resolvePath(val, projectPath) {
    if (val.match('https?://')) {
        return val;
    }
    return path.resolve(projectPath, val);
}
function parseImported(projectPath, importedHash) {
    if (!importedHash) {
        return null;
    }
    const newImportedHash = {};
    Object.keys(importedHash).forEach((key) => {
        const imported = importedHash[key];
        if (!imported || !imported.PATH) {
            return;
        }
        let importedPath = imported.PATH;
        if (!/^\/$/.test(importedPath)) {
            importedPath = resolvePath(importedPath, projectPath);
        }
        newImportedHash[key] = {
            PATH: importedPath,
            SPEED: imported.SPEED || 1,
        };
    });
    return newImportedHash;
}
function fixPath(projectPath, rc) {
    const PASSES = (rc.PASSES || []).map((pass) => {
        if (pass.MODEL && pass.MODEL.PATH) {
            pass.MODEL.PATH = resolvePath(pass.MODEL.PATH, projectPath);
        }
        if (pass.MODEL && pass.MODEL.MATERIAL) {
            pass.MODEL.MATERIAL = resolvePath(pass.MODEL.MATERIAL, projectPath);
        }
        return pass;
    });
    return Object.assign(Object.assign({}, rc), { IMPORTED: parseImported(projectPath, rc.IMPORTED) || {}, PASSES });
}
class Config extends events_1.EventEmitter {
    constructor(projectPath, rc) {
        super();
        this.globalRc = {};
        this.projectRc = {};
        this.fileRc = {};
        this.soundFileRc = {};
        this.isWatching = false;
        this.readConfigFile = (filename) => {
            return p(fs.readFile)(path.resolve(this.projectPath, filename), 'utf8').then((data) => ({ filename, data }));
        };
        this.load = () => {
            if (!this.isWatching) {
                return null;
            }
            return this.readConfigFile('.liverc')
                .then((d) => {
                console.log('[VEDA] `.liverc` is deprecated. Use `.vedarc` instead.');
                return d;
            })
                .catch(() => this.readConfigFile('.vedarc'))
                .then(({ filename, data }) => {
                try {
                    const rc = fixPath(this.projectPath, JSON5.parse(data));
                    this.setProjectSettings(rc);
                }
                catch (e) {
                    console.log('[VEDA] Failed to parse rc file:', filename);
                }
            })
                .catch(() => {
                console.log('[VEDA] config file not found');
            });
        };
        this.onChange = lodash_1.throttle(() => {
            const newRc = this.createRc();
            this.emit('change', this.getDiff(this.rc, newRc));
            this.rc = newRc;
        }, 100);
        this.rc = DEFAULT_RC;
        this.soundRc = DEFAULT_RC;
        this.setGlobalSettings(rc);
        this.projectPath = projectPath;
        if (projectPath) {
            fs.watch(projectPath, (_, filename) => {
                if (filename === '.liverc' || filename === '.vedarc') {
                    this.load();
                }
            });
        }
    }
    play() {
        this.isWatching = true;
        this.load();
    }
    stop() {
        this.isWatching = false;
        this.rc = DEFAULT_RC;
        this.soundRc = DEFAULT_RC;
    }
    createRc() {
        const IMPORTED = Object.assign(Object.assign({}, this.projectRc.IMPORTED), this.fileRc.IMPORTED);
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, DEFAULT_RC), this.globalRc), this.projectRc), this.fileRc), { IMPORTED });
    }
    createSoundRc() {
        const IMPORTED = Object.assign(Object.assign({}, this.projectRc.IMPORTED), this.soundFileRc.IMPORTED);
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, DEFAULT_RC), this.globalRc), this.projectRc), this.soundFileRc), { IMPORTED });
    }
    setGlobalSettings(rc) {
        this.globalRc = Object.assign(Object.assign({}, this.globalRc), rc);
        this.onChange();
    }
    setProjectSettings(rc) {
        this.projectRc = rc;
        this.onChange();
    }
    setFileSettings(rc) {
        this.fileRc = rc;
        const newRc = this.createRc();
        const diff = this.getDiff(this.rc, newRc);
        this.rc = newRc;
        return diff;
    }
    setSoundSettings(rc) {
        this.soundFileRc = rc;
        const newRc = this.createSoundRc();
        const diff = this.getDiff(this.soundRc, newRc);
        this.soundRc = newRc;
        return diff;
    }
    parseComment(filepath, comment) {
        let rc = {};
        try {
            rc = JSON5.parse(comment);
        }
        catch (e) {
            console.error('Failed to parse comment:', e);
        }
        rc = fixPath(path.dirname(filepath), rc);
        return rc;
    }
    setFileSettingsByString(filepath, comment) {
        return this.setFileSettings(this.parseComment(filepath, comment));
    }
    setSoundSettingsByString(filepath, comment) {
        return this.setSoundSettings(this.parseComment(filepath, comment));
    }
    getDiff(oldObj, newObj) {
        const diff = {
            newConfig: newObj,
            added: { IMPORTED: {} },
            removed: { IMPORTED: {} },
        };
        const newIMPORTED = newObj.IMPORTED;
        const oldIMPORTED = oldObj.IMPORTED;
        Object.keys(newIMPORTED).forEach((key) => {
            const newImport = newIMPORTED[key] || {};
            const oldImport = oldIMPORTED[key] || {};
            if (oldImport.PATH &&
                (newImport.PATH !== oldImport.PATH ||
                    newImport.SPEED !== oldImport.SPEED)) {
                diff.removed.IMPORTED[key] = oldImport;
            }
            if (newImport.PATH &&
                (newImport.PATH !== oldImport.PATH ||
                    newImport.SPEED !== oldImport.SPEED)) {
                diff.added.IMPORTED[key] = newImport;
            }
        });
        if (newObj.pixelRatio !== oldObj.pixelRatio) {
            diff.added.pixelRatio = newObj.pixelRatio;
        }
        if (newObj.frameskip !== oldObj.frameskip) {
            diff.added.frameskip = newObj.frameskip;
        }
        if (newObj.vertexMode !== oldObj.vertexMode) {
            diff.added.vertexMode = newObj.vertexMode;
        }
        if (newObj.vertexCount !== oldObj.vertexCount) {
            diff.added.vertexCount = newObj.vertexCount;
        }
        if (newObj.glslangValidatorPath !== oldObj.glslangValidatorPath) {
            diff.added.glslangValidatorPath = newObj.glslangValidatorPath;
        }
        if (newObj.fftSize !== oldObj.fftSize) {
            diff.added.fftSize = newObj.fftSize;
        }
        if (newObj.fftSmoothingTimeConstant !== oldObj.fftSmoothingTimeConstant) {
            diff.added.fftSmoothingTimeConstant =
                newObj.fftSmoothingTimeConstant;
        }
        if (newObj.audio !== oldObj.audio) {
            diff.added.audio = newObj.audio;
        }
        if (newObj.camera !== oldObj.camera) {
            diff.added.camera = newObj.camera;
        }
        if (newObj.gamepad !== oldObj.gamepad) {
            diff.added.gamepad = newObj.gamepad;
        }
        if (newObj.midi !== oldObj.midi) {
            diff.added.midi = newObj.midi;
        }
        if (newObj.keyboard !== oldObj.keyboard) {
            diff.added.keyboard = newObj.keyboard;
        }
        if (newObj.server !== oldObj.server) {
            diff.added.server = newObj.server;
        }
        if (newObj.osc !== oldObj.osc) {
            diff.added.osc = newObj.osc;
        }
        if (newObj.soundLength !== oldObj.soundLength) {
            diff.added.soundLength = newObj.soundLength;
        }
        return diff;
    }
}
exports.default = Config;
//# sourceMappingURL=config.js.map