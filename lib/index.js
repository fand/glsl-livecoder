"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wrapper_1 = require("./wrapper");
let wrapper = null;
module.exports = {
    config: {
        glslangValidatorPath: {
            title: 'Custom glslangValidator path (optional)',
            description: 'VEDA uses prebuilt glslangValidator by default. Specify custom path if you want.',
            type: 'string',
            default: '',
            order: 1,
        },
        pixelRatio: {
            title: 'Pixel Ratio',
            description: 'The ratio of pixel per rendering call. Increasing pixel ratio will reduce CPU/GPU load.',
            type: 'number',
            default: 2,
            minimum: 0.5,
            maximum: 8,
            order: 2,
        },
        frameskip: {
            title: 'Frameskip',
            description: 'Increasing frameskip will reduce CPU/GPU load. Default is 2 (= 30 fps).',
            type: 'integer',
            default: 2,
            minimum: 1,
            maximum: 10,
            order: 3,
        },
        vertexCount: {
            title: 'Vertex Count',
            description: 'The number of vertices in vertex shaders.',
            type: 'integer',
            default: 3000,
            minimum: 10,
            maximum: 20000,
            order: 4,
        },
        vertexMode: {
            title: 'Vertex Mode',
            description: 'How to draw vertices.',
            type: 'string',
            default: 'LINE_STRIP',
            enum: [
                { value: 'POINTS', description: 'POINTS' },
                { value: 'LINE_STRIP', description: 'LINE_STRIP' },
                { value: 'LINE_LOOP', description: 'LINE_LOOP' },
                { value: 'LINES', description: 'LINES' },
                { value: 'TRI_STRIP', description: 'TRI_STRIP' },
                { value: 'TRI_FAN', description: 'TRI_FAN' },
                { value: 'TRIANGLES', description: 'TRIANGLES' },
            ],
            order: 5,
        },
        fftSize: {
            title: 'FFT size',
            description: 'Represents the size of the FFT to be used to determine the frequency domain.',
            type: 'integer',
            default: 2048,
            enum: [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768],
            order: 6,
        },
        fftSmoothingTimeConstant: {
            title: 'FFT smoothingTimeConstant',
            description: 'Represents the averaging constant with the last analysis frame.',
            type: 'number',
            default: 0.8,
            minimum: 0,
            maximum: 1,
            order: 7,
        },
        recordingMode: {
            title: 'Recording Mode',
            description: 'File format to record images',
            type: 'string',
            default: 'mp4',
            enum: ['mp4', 'gif'],
            order: 8,
        },
    },
    activate(state) {
        require('atom-package-deps')
            .install('veda')
            .then(() => this._activate(state));
    },
    _activate(state) {
        wrapper = new wrapper_1.default(state);
    },
    deactivate() {
        wrapper && wrapper.destroy();
    },
};
//# sourceMappingURL=index.js.map