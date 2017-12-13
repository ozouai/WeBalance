"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var originalReadFile = fs.readFile;
var originalReadFileSync = fs.readFileSync;
var myPath = path.dirname(require.main.filename);
console.log(myPath);
fs.readFile = function (path, options, callback) {
    console.log(normalizePath(path));
    originalReadFile(path, options, callback);
};
fs.readFileSync = function (path, options) {
    console.log(normalizePath(path));
    return originalReadFileSync(path, options);
};
var originalStat = fs.stat;
var originalCreateReadStream = fs.createReadStream;
fs.createReadStream = function (path, options) {
    console.log(normalizePath(path));
    return originalCreateReadStream(path, options);
};
function normalizePath(path) {
    path = path.replace(myPath, "");
    if (path.charAt(0) == "/" || path.charAt(0) == "\\")
        path = path.slice(1);
    return path;
}
