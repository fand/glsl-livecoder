import { BlendMode } from './config';

export const INITIAL_FRAGMENT_SHADER = `
precision mediump float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    gl_FragColor = vec4(uv,0.5+0.5*sin(time),1.0);
}
`;

export const INITIAL_SOUND_SHADER = `
precision mediump float;
vec2 mainSound(in float time) {
    return vec2(sin(time* 440.), sin(time * 660.));
}
`;

export const INITIAL_SHADER = [
    {
        fs: INITIAL_FRAGMENT_SHADER,
    },
];

interface PassModel {
    PATH: string;
}

export interface Pass {
    MODEL?: PassModel;
    TARGET?: string;
    vs?: string;
    fs?: string;
    FLOAT?: boolean;
    WIDTH?: string;
    HEIGHT?: string;
    BLEND?: BlendMode;
    GLSL3?: boolean;
}

export type Shader = Pass[];
export type SoundShader = string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VedaStatus = any;

export interface OscData {
    name: string;
    data: number[];
}

export interface LoadShaderCommand {
    type: 'LOAD_SHADER';
    shader: Shader;
}

export interface LoadSoundShaderCommand {
    type: 'LOAD_SOUND_SHADER';
    shader: string;
}

export interface PlayCommand {
    type: 'PLAY';
}

export interface PlaySoundCommand {
    type: 'PLAY_SOUND';
}

export interface SetOscCommand {
    type: 'SET_OSC';
    data: OscData;
}

export interface StartRecordingCommand {
    type: 'START_RECORDING';
}

export interface StopCommand {
    type: 'STOP';
}

export interface StopRecordingCommand {
    type: 'STOP_RECORDING';
}

export interface StopSoundCommand {
    type: 'STOP_SOUND';
}

export interface ToggleFullscreenCommand {
    type: 'TOGGLE_FULLSCREEN';
}

export type Command =
    | LoadShaderCommand
    | LoadSoundShaderCommand
    | PlayCommand
    | PlaySoundCommand
    | SetOscCommand
    | StartRecordingCommand
    | StopCommand
    | StopRecordingCommand
    | StopSoundCommand
    | ToggleFullscreenCommand;

export interface AudioInputsQuery {
    type: 'AUDIO_INPUTS';
}

export interface TimeQuery {
    type: 'TIME';
}

export interface VideoInputsQuery {
    type: 'VIDEO_INPUTS';
}

export type Query = AudioInputsQuery | TimeQuery | VideoInputsQuery;
export type QueryResult = number | MediaDeviceInfo[];
