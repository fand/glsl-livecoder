import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './components/app';
import { IRc } from './config';

export default class View {
    private wrapper: HTMLElement;
    private element: HTMLElement;
    private react: any;

    // private settings: HTMLDivElement;
    private isFullscreen = false;

    constructor(wrapper: HTMLElement, rc: IRc) {
        this.wrapper = wrapper;
        this.element = document.createElement('div');
        this.element.classList.add('veda');

        this.wrapper.appendChild(this.element);

        this.react = ReactDOM.render(<App rc={rc}/>, this.element);
    }

    destroy(): void {
        if (this.react) {
            console.log(this.react);
            // this.react.destroy();
        }
    }

    getCanvas(): HTMLCanvasElement {
        return this.react.canvas;
    }

    show(): void {
        document.body.classList.add('veda-enabled');
    }

    hide(): void {
        document.body.classList.remove('veda-enabled');
    }

    toggleFullscreen(): void {
        this.isFullscreen = !this.isFullscreen;
        if (this.isFullscreen) {
            document.body.classList.add('veda-fullscreen');
        } else {
            document.body.classList.remove('veda-fullscreen');
        }
    }
}
