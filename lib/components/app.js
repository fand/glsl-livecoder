"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const Settings = (props) => React.createElement(React.Fragment, null,
    React.createElement("h3", null, "SETTINGS@@@"),
    React.createElement("p", null, JSON.stringify(props.rc)));
class App extends React.Component {
    constructor() {
        super(...arguments);
        this.setCanvas = (el) => {
            this.canvas = el;
        };
    }
    render() {
        return React.createElement(React.Fragment, null,
            React.createElement("canvas", { ref: this.setCanvas }),
            React.createElement(Settings, { rc: this.props.rc }));
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map