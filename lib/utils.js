"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertPathForServer = void 0;
const path = require("path");
const isRelative = require("is-relative");
function convertPathForServer(projectPath, port, target) {
    if (target.match(/^(?:https?:)?\/\//)) {
        return target;
    }
    if (isRelative(target)) {
        target = path.join(projectPath, target);
    }
    let relativePath = path.relative(projectPath, target);
    if (path.sep === '\\') {
        relativePath = relativePath.replace(/\\/g, '/');
    }
    return `http://localhost:${port}/link/${relativePath}`;
}
exports.convertPathForServer = convertPathForServer;
//# sourceMappingURL=utils.js.map