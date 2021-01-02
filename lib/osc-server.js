#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dgram = require("dgram");
const osc = require("osc-min");
function printMessage(msg) {
    if (msg.oscType === 'bundle') {
        msg.elements.forEach(printMessage);
    }
    else {
        const msgToShow = Object.assign(Object.assign({}, msg), { args: msg.args.map((a) => a.value) });
        console.log(JSON.stringify(msgToShow));
    }
}
{
    const PORT = parseInt(process.argv[2]) || 57121;
    const sock = dgram.createSocket('udp4', (buf) => {
        try {
            printMessage(osc.fromBuffer(buf));
        }
        catch (e) {
            console.error(e);
        }
    });
    sock.bind(PORT);
}
//# sourceMappingURL=osc-server.js.map