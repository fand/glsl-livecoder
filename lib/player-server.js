"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const child_process_1 = require("child_process");
const io = require("socket.io-client");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
class PlayerServer {
    constructor(port, state) {
        this.stdout = (output) => {
            atom.notifications.addSuccess(output.toString().trim());
        };
        this.stderr = (output) => {
            atom.notifications.addError(output.toString().trim());
        };
        this.exit = (code) => {
            console.log('[VEDA] Server exited with code', code);
            this.io.emit('stop');
        };
        this.port = port;
        this.state = state;
        this.server = child_process_1.spawn('node', [
            path.resolve(__dirname, 'server.js'),
            port.toString(),
            this.state.projectPath,
        ], {
            cwd: path.resolve(__dirname, '..'),
        });
        if (this.server.stdout) {
            this.server.stdout.on('data', this.stdout);
        }
        if (this.server.stderr) {
            this.server.stderr.on('data', this.stderr);
        }
        this.server.on('exit', this.exit);
        this.io = io(`http://localhost:${port}`);
        this.io.on('ready', () => {
            const newState = lodash_1.cloneDeep(this.state);
            newState.rc.IMPORTED = this.convertPaths(newState.rc.IMPORTED);
            this.io.emit('create', newState);
        });
    }
    destroy() {
        this.io.emit('destroy');
        try {
            this.server.kill();
        }
        catch (e) {
            console.error(e);
        }
    }
    onChange(_rcDiff) {
        const rcDiff = lodash_1.cloneDeep(_rcDiff);
        rcDiff.newConfig.IMPORTED = this.convertPaths(rcDiff.newConfig.IMPORTED);
        rcDiff.added.IMPORTED = this.convertPaths(rcDiff.added.IMPORTED);
        rcDiff.removed.IMPORTED = this.convertPaths(rcDiff.removed.IMPORTED);
        this.io.emit('onChange', rcDiff);
    }
    command(command) {
        this.io.emit('command', command);
        switch (command.type) {
            case 'LOAD_SHADER':
                return this.loadShader(command.shader);
            case 'STOP':
                return this.stop();
        }
    }
    query(query) {
        return new Promise((resolve, reject) => {
            this.io.emit('query', query, (err, value) => {
                if (err) {
                    return reject(err);
                }
                else {
                    return resolve(value);
                }
            });
        });
    }
    convertPaths(IMPORTED) {
        Object.keys(IMPORTED).forEach((key) => {
            IMPORTED[key].PATH = utils_1.convertPathForServer(this.state.projectPath, this.port, IMPORTED[key].PATH);
        });
        return IMPORTED;
    }
    stop() {
        try {
            this.server.kill();
        }
        catch (e) {
            console.error(e);
        }
        atom.notifications.addSuccess('[VEDA] Server stopped');
    }
    loadShader(shader) {
        this.state.lastShader = shader;
    }
}
exports.default = PlayerServer;
//# sourceMappingURL=player-server.js.map