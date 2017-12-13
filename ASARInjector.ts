import * as fs from "fs";
import * as path from "path";
const originalReadFile = fs.readFile;
const originalReadFileSync = fs.readFileSync;
const myPath = path.dirname(require.main.filename);
console.log(myPath);
fs.readFile = function(path: any, options: any, callback: any){
    console.log(normalizePath(path));
    originalReadFile(path, options, callback);
}

fs.readFileSync = function(path: any, options: any) {
    console.log(normalizePath(path));
    return originalReadFileSync(path, options);
}

const originalStat = fs.stat;

const originalCreateReadStream = fs.createReadStream;

fs.createReadStream = function(path: any, options: any) {
    console.log(normalizePath(path));
    return originalCreateReadStream(path, options);
}


function normalizePath(path: string) : string {
    path = path.replace(myPath, "")
    if(path.charAt(0) == "/" || path.charAt(0) == "\\") path = path.slice(1);
    return path;
}