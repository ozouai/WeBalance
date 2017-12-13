const MainFiles = [
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
]


import * as fs from "fs";

if(fs.existsSync("build"))
    fs.rmdirSync("build");
fs.mkdirSync("build");

for(let file of MainFiles) {
    fs.copyFileSync(file, "build/"+file);
}

