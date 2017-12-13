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

const originalStat = fs.stat;

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
    console.log();
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