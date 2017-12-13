import * as fs from "fs";
import * as path from "path";
import Module = require("module");
import asar = require("asar");
const originalReadFile = fs.readFile;
const originalReadFileSync = fs.readFileSync;
const myPath = path.dirname(require.main.filename);
//console.log(myPath);
fs.readFile = function(path: any, options: any, callback: any){
    let apath = normalizePath(path);
    //console.log("async");
    //console.log(apath);
    if(asarContains(apath)) {
        let buf : Buffer = asar.extractFile(registeredFiles[apath], apath.slice(1));
        if(options == "UTF-8") callback(null, buf.toString("UTF-8"));
        else callback(null, buf);
        return;
    }
    originalReadFile(path, options, callback);
}

fs.readFileSync = function(path: any, options: any) {
    let apath = normalizePath(path);
    //console.log("sync");
    //console.log(apath);
    if(asarContains(apath)) {
        let buf : Buffer = asar.extractFile(registeredFiles[apath], apath.slice(1));
        if(typeof options == "string") return buf.toString(options);
        if(typeof options == "object") {
            if(options.encoding) return buf.toString(options.encoding);
        }
        else return buf;
    }
    return originalReadFileSync(path, options);
}

const originalCreateReadStream = fs.createReadStream;
let Duplex = require('stream').Duplex;
function bufferToStream(buffer) {
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
fs.createReadStream = function(path: any, options: any) {
    let apath = normalizePath(path);
    //console.log(apath);
    if(asarContains(normalizePath(path))) {
        //console.log("Trying Extract of "+apath+" from "+registeredFiles[apath]);
        let buf : Buffer = asar.extractFile(registeredFiles[apath], apath.slice(1));
        return bufferToStream(buf);
    }
    return originalCreateReadStream(path, options);
}


const originalFindPath = Module._findPath;
Module._findPath = function(request, paths) {
    let apath = normalizePath(path.resolve(request));
    let bpath = apath+".js"
    let cpath = path.normalize(apath+"/index.js");
    if(asarContains(apath)) {
        let cacheKey = JSON.stringify({request, paths});
        Module._pathCache[cacheKey] = path.normalize(myPath+"/"+apath);
        return path.normalize(myPath+"/"+apath);
    } else if(asarContains(bpath)) {
        let cacheKey = JSON.stringify({request, paths});
        Module._pathCache[cacheKey] = path.normalize(myPath+"/"+bpath);
        return path.normalize(myPath+"/"+bpath);
    } else if(asarContains(cpath)) {
        let cacheKey = JSON.stringify({request, paths});
        Module._pathCache[cacheKey] = path.normalize(myPath+"/"+cpath);
        return path.normalize(myPath+"/"+cpath);
    } else {
        return originalFindPath(request, paths);
    }

}

const launchTime = new Date();

function wrapStats(_path: string, stats: any) {
    stats["isFile"] = function() {
        return true;
    }
    stats["isDirectory"] = function() {
        return false;
    }
    stats["isBlockDevice"] = function() {
        return false;
    }
    stats["isCharacterDevice"] = function() {
        return false;
    }
    stats["isSymbolicLink"] = function() {
        return false;
    }
    stats["isFIFO"] = function() {
        return false;
    }
    stats["isSocket"] = function () {
        return false;
    }
    stats["mtime"] = launchTime;
    stats["atime"] = launchTime;
    stats["ctime"] = launchTime;
    stats["birthtime"] = launchTime;
    stats["ino"] = 1;
    return stats;
}

const originalStat = fs.stat;
fs.stat = function(_path: any, callback: any) {
    let apath= normalizePath(path.resolve(_path));
    if(asarContains(apath)) {
        let stats = asar.statFile(registeredFiles[apath], apath.slice(1), true);
        callback(null, wrapStats(apath,stats));
    } else {
        originalStat(_path, callback);
    }
}


const originalStatSync = fs.statSync;
fs.statSync = function(_path: any) {
    let apath= normalizePath(path.resolve(_path));
    if(asarContains(apath)) {
        let stats = asar.statFile(registeredFiles[apath], apath.slice(1), true);
        return stats
    } else {
        return wrapStats(apath, originalStatSync(_path));
    }
}

function asarContains(path: string):boolean {
    if(registeredFiles[path]) return true;
    return false;
}

function normalizePath(_path: string) : string {
    _path = _path.replace(myPath, "")
    //if(path.charAt(0) == "/" || path.charAt(0) == "\\") path = path.slice(1);
    if(_path.charAt(0) != "/" && _path.charAt(0) != "\\") _path = path.normalize("/"+_path);
    return _path;
}

export function loadASAR(_path:string) {
    for(let line of asar.listPackage(_path)) {
        let norm = path.normalize(line);
        registeredFiles[norm] = _path;
    }
}

let registeredFiles: {
    [key: string]: string;
} = {};