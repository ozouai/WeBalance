
import * as fs from "fs";
import * as ps from "child_process";
const packageJ = JSON.parse(fs.readFileSync("package.json", "UTF-8"));
if(!fs.existsSync("appLock.json")) {
    let d : AppLock = {
        currentVersion: "0.0.0",
        nodemodulesVersion: "0.0.0",
        needsUpdate: false
    }
    fs.writeFileSync("appLock.json", JSON.stringify(d));
}

const lock : AppLock = JSON.parse(fs.readFileSync("appLock.json", "UTF-8"));

if(fs.existsSync("update")) {
    console.log(`[${new Date()}] Update Detected`)
}

if(lock.nodemodulesVersion != packageJ.version) {
    console.log("["+new Date()+"] Updating NPM Modules");
    ps.execSync("npm install --only=production");
    lock.nodemodulesVersion = packageJ.version;
    fs.writeFileSync("appLock.json", JSON.stringify(lock));
    console.log("["+new Date()+"] NPM Modules Updated");
}
import {loadASAR} from "./ASARInjector";
if(fs.existsSync("build")) {
    loadASAR("build/main.asar");
    loadASAR("build/admin.asar");
    loadASAR("build/proxy.asar");
    require("./app");
} else {
    loadASAR("main.asar");
    loadASAR("admin.asar");
    loadASAR("proxy.asar");
    require("./app");
}






interface AppLock {
    needsUpdate?: boolean;
    currentVersion?: string,
    nodemodulesVersion?: string;
}