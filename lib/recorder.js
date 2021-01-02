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
const fs = require("fs");
const path = require("path");
const p = require("pify");
const child_process_1 = require("child_process");
const mkdirp = require("mkdirp");
const ffmpegPath = require("ffmpeg-static");
const shell = require("shell");
class Recorder {
    constructor() {
        this.isRecording = false;
        this.recordingFrames = 0;
        this.recordedFrames = 0;
        this.recordDir = '';
        this.framesDir = '';
        this.mode = 'mp4';
        this.fps = 60;
        this.width = 1920;
        this.height = 1080;
    }
    setMode(mode) {
        this.mode = mode;
    }
    start(canvas, fps, width, height, dst) {
        return __awaiter(this, void 0, void 0, function* () {
            this.isRecording = true;
            this.recordingFrames = 0;
            this.recordedFrames = 0;
            this.fps = fps;
            this.width = width;
            this.height = height;
            const timestamp = new Date()
                .toISOString()
                .replace(/\..*/, '')
                .replace(/[^\d]/g, '-');
            this.recordDir = path.resolve(dst, 'veda-recordings', timestamp);
            this.framesDir = path.resolve(this.recordDir, 'frames');
            yield mkdirp(this.recordDir);
            yield mkdirp(this.framesDir);
            atom.notifications.addInfo(`[VEDA] Start recording to ${this.recordDir} ...`);
            let frame = -1;
            const frameskip = 60 / this.fps;
            const capture = () => __awaiter(this, void 0, void 0, function* () {
                if (!this.isRecording) {
                    return;
                }
                frame++;
                if (frame % frameskip !== 0) {
                    requestAnimationFrame(capture);
                    return;
                }
                const pngDataUrl = canvas.toDataURL('image/png');
                const filename = 'veda-' +
                    this.recordingFrames.toString().padStart(5, '0') +
                    '.png';
                this.recordingFrames++;
                requestAnimationFrame(capture);
                const pngBuf = new Buffer(pngDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                const dstPath = path.resolve(this.framesDir, filename);
                yield p(fs.writeFile)(dstPath, pngBuf);
                this.recordedFrames++;
            });
            capture();
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isRecording) {
                return;
            }
            this.isRecording = false;
            const timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                if (this.recordingFrames !== this.recordedFrames) {
                    return;
                }
                clearTimeout(timer);
                this.finalize();
            }), 300);
        });
    }
    finalize() {
        return __awaiter(this, void 0, void 0, function* () {
            const basename = `veda-${Date.now()}.${this.mode}`;
            const dst = path.resolve(this.recordDir, basename);
            atom.notifications.addInfo(`[VEDA] Converting images to ${dst}...`);
            if (this.mode === 'mp4') {
                yield this.convertToMp4(dst);
            }
            else if (this.mode === 'gif') {
                yield this.convertToGif(dst);
            }
            atom.notifications.addSuccess(`[VEDA] Recorded to ${dst}`);
            shell.showItemInFolder(dst);
        });
    }
    convertToMp4(dst) {
        return __awaiter(this, void 0, void 0, function* () {
            const capturedFilesPath = path.resolve(this.framesDir, 'veda-%5d.png');
            yield p(child_process_1.exec)([
                ffmpegPath,
                `-framerate ${this.fps}`,
                `-i ${capturedFilesPath}`,
                `-c:v libx264`,
                `-vf "pad=ceil(iw/2)*2:ceil(ih/2)*2"`,
                `-r ${this.fps} -pix_fmt yuv420p`,
                dst,
            ].join(' '));
        });
    }
    convertToGif(dst) {
        return __awaiter(this, void 0, void 0, function* () {
            const capturedFilesPath = path.resolve(this.framesDir, 'veda-%5d.png');
            const palettePath = path.resolve(this.recordDir, 'palette.png');
            const filters = `fps=${this.fps},scale=${this.width}:${this.height}:flags=lanczos,pad=ceil(iw/2)*2:ceil(ih/2)*2`;
            yield p(child_process_1.exec)([
                ffmpegPath,
                ` -i ${capturedFilesPath}`,
                ` -vf palettegen ${palettePath}`,
            ].join(' '));
            yield p(child_process_1.exec)([
                ffmpegPath,
                `-framerate ${this.fps}`,
                `-i ${capturedFilesPath}`,
                `-i ${palettePath}`,
                `-lavfi "${filters} [x];[x][1:v]paletteuse"`,
                dst,
            ].join(' '));
        });
    }
    setRecordingMode(mode) {
        if (mode === 'mp4' || mode === 'gif') {
            this.mode = mode;
        }
    }
}
exports.default = Recorder;
//# sourceMappingURL=recorder.js.map