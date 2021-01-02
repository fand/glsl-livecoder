"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFile = exports.validator = void 0;
const fs_1 = require("fs");
const path = require("path");
const execa = require("execa");
const tmp = require("tmp");
const p = require("pify");
const glslify = require("glslify-lite");
function validator(glslangValidatorPath, shader, postfix) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmpfile = yield p(tmp.file)({
            keep: true,
            postfix,
            discardDescriptor: true,
        });
        yield p(fs_1.writeFile)(tmpfile, shader, 'utf8');
        const result = yield execa(glslangValidatorPath, [tmpfile]);
        if (result.stdout.match(/ERROR/)) {
            throw new Error(result.stdout);
        }
    });
}
exports.validator = validator;
function loadFile(glslangValidatorPath, filePath, useGlslify = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (useGlslify) {
            return yield glslify.file(filePath, {
                basedir: path.dirname(filePath),
            });
        }
        const result = yield execa(glslangValidatorPath, [filePath]);
        if (result.stdout.match(/ERROR/)) {
            throw new Error(result.stdout);
        }
        return yield p(fs_1.readFile)(filePath, 'utf8');
    });
}
exports.loadFile = loadFile;
//# sourceMappingURL=validator.js.map