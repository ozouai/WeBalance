"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MainFiles = [
    "AdminServer.js",
    "app.js",
    "AppConfig.js",
    "ASARInjector.js",
    "CertificateStorage.js",
    "EndpointManager.js",
    "Errors.js",
    "FileController.js",
    "LetsEncrypt.js",
    "LetsEncryptAgent.js",
    "package.json",
    "package-lock.json",
    "ProxyAssetServer.js",
    "SafeSave.js",
    "StatsCollector.js"
];
var fs = require("fs");
if (fs.existsSync("build"))
    fs.rmdirSync("build");
fs.mkdirSync("build");
for (var _i = 0, MainFiles_1 = MainFiles; _i < MainFiles_1.length; _i++) {
    var file = MainFiles_1[_i];
    fs.copyFileSync(file, "build/" + file);
}
