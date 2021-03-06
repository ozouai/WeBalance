"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var ps = require("child_process");
var packageJ = JSON.parse(fs.readFileSync("package.json", "UTF-8"));
if (!fs.existsSync("appLock.json")) {
    var d = {
        currentVersion: "0.0.0",
        nodemodulesVersion: "0.0.0",
        needsUpdate: false
    };
    fs.writeFileSync("appLock.json", JSON.stringify(d));
}
var lock = JSON.parse(fs.readFileSync("appLock.json", "UTF-8"));
if (fs.existsSync("update")) {
    console.log("[" + new Date() + "] Update Detected");
}
if (lock.nodemodulesVersion != packageJ.version) {
    console.log("[" + new Date() + "] Updating NPM Modules");
    ps.execSync("npm install --only=production");
    lock.nodemodulesVersion = packageJ.version;
    fs.writeFileSync("appLock.json", JSON.stringify(lock));
    console.log("[" + new Date() + "] NPM Modules Updated");
}
var ASARInjector_1 = require("./ASARInjector");
if (fs.existsSync("build")) {
    ASARInjector_1.loadASAR("build/main.asar");
    ASARInjector_1.loadASAR("build/admin.asar");
    ASARInjector_1.loadASAR("build/proxy.asar");
    require("./app");
}
else {
    ASARInjector_1.loadASAR("main.asar");
    ASARInjector_1.loadASAR("admin.asar");
    ASARInjector_1.loadASAR("proxy.asar");
    require("./app");
}
