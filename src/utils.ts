import * as path from 'path';
const isRelative = require('is-relative');

export function convertPathForServer(
    projectPath: string,
    port: number,
    target: string,
) {
    if (target.match(/^(?:https?:)?\/\//)) {
        return target;
    }

    // Fix target to absolute path
    if (isRelative(target)) {
        target = path.join(projectPath, target);
    }

    // Get relative path from projectPath
    let relativePath = path.relative(projectPath, target);

    if (path.sep === '\\') {
        relativePath = relativePath.replace(/\\/g, '/');
    }

    return `http://localhost:${port}/link/${relativePath}`;
}
