"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_SHADER = exports.INITIAL_SOUND_SHADER = exports.INITIAL_FRAGMENT_SHADER = void 0;
exports.INITIAL_FRAGMENT_SHADER = `
precision mediump float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    gl_FragColor = vec4(uv,0.5+0.5*sin(time),1.0);
}
`;
exports.INITIAL_SOUND_SHADER = `
precision mediump float;
vec2 mainSound(in float time) {
    return vec2(sin(time* 440.), sin(time * 660.));
}
`;
exports.INITIAL_SHADER = [
    {
        fs: exports.INITIAL_FRAGMENT_SHADER,
    },
];
//# sourceMappingURL=constants.js.map