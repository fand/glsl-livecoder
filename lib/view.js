"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ReactDOM = require("react-dom");
const app_1 = require("./components/app");
class View {
    constructor(wrapper, rc) {
        this.isFullscreen = false;
        this.wrapper = wrapper;
        this.element = document.createElement('div');
        this.element.classList.add('veda');
        this.wrapper.appendChild(this.element);
        this.react = ReactDOM.render(React.createElement(app_1.default, { rc: rc }), this.element);
    }
    destroy() {
        if (this.react) {
            console.log(this.react);
        }
    }
    getCanvas() {
        return this.react.canvas;
    }
    show() {
        document.body.classList.add('veda-enabled');
    }
    hide() {
        document.body.classList.remove('veda-enabled');
    }
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        if (this.isFullscreen) {
            document.body.classList.add('veda-fullscreen');
        }
        else {
            document.body.classList.remove('veda-fullscreen');
        }
    }
}
exports.default = View;
//# sourceMappingURL=view.js.map