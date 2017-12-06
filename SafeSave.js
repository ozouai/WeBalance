"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
function saveSync(filename, content) {
    fs.writeFileSync(filename + "_tmp", content);
    if (fs.existsSync(filename)) {
        fs.renameSync(filename, filename + "_bak");
    }
    fs.renameSync(filename + "_tmp", filename);
}
exports.saveSync = saveSync;
