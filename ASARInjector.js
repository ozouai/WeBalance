"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var Module = require("module");
var asar = require("asar");
var originalReadFile = fs.readFile;
var originalReadFileSync = fs.readFileSync;
var myPath = path.dirname(require.main.filename);
//console.log(myPath);
fs.readFile = function (path, options, callback) {
    var apath = normalizePath(path);
    //console.log("async");
    //console.log(apath);
    if (asarContains(apath)) {
        var buf = asar.extractFile(registeredFiles[apath], apath.slice(1));
        if (options == "UTF-8")
            callback(null, buf.toString("UTF-8"));
        else
            callback(null, buf);
        return;
    }
    originalReadFile(path, options, callback);
};
fs.readFileSync = function (path, options) {
    var apath = normalizePath(path);
    //console.log("sync");
    //console.log(apath);
    if (asarContains(apath)) {
        var buf = asar.extractFile(registeredFiles[apath], apath.slice(1));
        if (typeof options == "string")
            return buf.toString(options);
        if (typeof options == "object") {
            if (options.encoding)
                return buf.toString(options.encoding);
        }
        else
            return buf;
    }
    return originalReadFileSync(path, options);
};
var originalCreateReadStream = fs.createReadStream;
var Duplex = require('stream').Duplex;
function bufferToStream(buffer) {
    var stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
fs.createReadStream = function (path, options) {
    var apath = normalizePath(path);
    //console.log(apath);
    if (asarContains(normalizePath(path))) {
        //console.log("Trying Extract of "+apath+" from "+registeredFiles[apath]);
        var buf = asar.extractFile(registeredFiles[apath], apath.slice(1));
        return bufferToStream(buf);
    }
    return originalCreateReadStream(path, options);
};
var originalFindPath = Module._findPath;
Module._findPath = function (request, paths) {
    var apath = normalizePath(path.resolve(request));
    var bpath = apath + ".js";
    var cpath = path.normalize(apath + "/index.js");
    if (asarContains(apath)) {
        var cacheKey = JSON.stringify({ request: request, paths: paths });
        Module._pathCache[cacheKey] = path.normalize(myPath + "/" + apath);
        return path.normalize(myPath + "/" + apath);
    }
    else if (asarContains(bpath)) {
        var cacheKey = JSON.stringify({ request: request, paths: paths });
        Module._pathCache[cacheKey] = path.normalize(myPath + "/" + bpath);
        return path.normalize(myPath + "/" + bpath);
    }
    else if (asarContains(cpath)) {
        var cacheKey = JSON.stringify({ request: request, paths: paths });
        Module._pathCache[cacheKey] = path.normalize(myPath + "/" + cpath);
        return path.normalize(myPath + "/" + cpath);
    }
    else {
        return originalFindPath(request, paths);
    }
};
var launchTime = new Date();
function wrapStats(_path, stats) {
    stats["isFile"] = function () {
        return true;
    };
    stats["isDirectory"] = function () {
        return false;
    };
    stats["isBlockDevice"] = function () {
        return false;
    };
    stats["isCharacterDevice"] = function () {
        return false;
    };
    stats["isSymbolicLink"] = function () {
        return false;
    };
    stats["isFIFO"] = function () {
        return false;
    };
    stats["isSocket"] = function () {
        return false;
    };
    stats["mtime"] = launchTime;
    stats["atime"] = launchTime;
    stats["ctime"] = launchTime;
    stats["birthtime"] = launchTime;
    stats["ino"] = 1;
    return stats;
}
var originalStat = fs.stat;
fs.stat = function (_path, callback) {
    var apath = normalizePath(path.resolve(_path));
    if (asarContains(apath)) {
        var stats = asar.statFile(registeredFiles[apath], apath.slice(1), true);
        callback(null, wrapStats(apath, stats));
    }
    else {
        originalStat(_path, callback);
    }
};
var originalStatSync = fs.statSync;
fs.statSync = function (_path) {
    var apath = normalizePath(path.resolve(_path));
    if (asarContains(apath)) {
        var stats = asar.statFile(registeredFiles[apath], apath.slice(1), true);
        return stats;
    }
    else {
        return wrapStats(apath, originalStatSync(_path));
    }
};
function asarContains(path) {
    if (registeredFiles[path])
        return true;
    return false;
}
function normalizePath(_path) {
    _path = _path.replace(myPath, "");
    //if(path.charAt(0) == "/" || path.charAt(0) == "\\") path = path.slice(1);
    if (_path.charAt(0) != "/" && _path.charAt(0) != "\\")
        _path = path.normalize("/" + _path);
    return _path;
}
function loadASAR(_path) {
    for (var _i = 0, _a = asar.listPackage(_path); _i < _a.length; _i++) {
        var line = _a[_i];
        var norm = path.normalize(line);
        registeredFiles[norm] = _path;
    }
}
exports.loadASAR = loadASAR;
var registeredFiles = {};
