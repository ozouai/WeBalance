"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var fse = require("fs-extra");
var rimraf = require("rimraf");
var asar = require("asar");
var ps = require("child_process");
var arg = process.argv[2];
var packageJ = JSON.parse(fs.readFileSync("package.json", "UTF-8"));
if (arg == "build") {
    var MainASARFiles = [
        "AdminServer.js",
        "AppConfig.js",
        "CertificateStorage.js",
        "EndpointManager.js",
        "Errors.js",
        "app.js",
        "FileController.js",
        "LetsEncrypt.js",
        "LetsEncryptAgent.js",
        "ProxyAssetServer.js",
        "SafeSave.js",
        "StatsCollector.js",
        "SharedInterfaces.js"
    ];
    if (fs.existsSync("temp"))
        rimraf.sync("temp");
    if (fs.existsSync("build"))
        rimraf.sync("build");
    fs.mkdirSync("build");
    fs.mkdirSync("temp");
    fs.mkdirSync("temp/main");
    for (var _i = 0, MainASARFiles_1 = MainASARFiles; _i < MainASARFiles_1.length; _i++) {
        var file = MainASARFiles_1[_i];
        fs.copyFileSync(file, "temp/main/" + file);
    }
    var i_1 = 0;
    function done() {
        i_1++;
        if (i_1 >= 3) {
            fs.copyFileSync("temp/main.asar", "build/main.asar");
            fs.copyFileSync("temp/admin.asar", "build/admin.asar");
            fs.copyFileSync("temp/proxy.asar", "build/proxy.asar");
            fs.copyFileSync("launch.js", "build/launch.js");
            fs.copyFileSync("ASARInjector.js", "build/ASARInjector.js");
            fs.copyFileSync("package.json", "build/package.json");
            fs.copyFileSync("package-lock.json", "build/package-lock.json");
        }
    }
    asar.createPackage("temp/main", "temp/main.asar", function () {
        done();
    });
    fs.mkdirSync("temp/admin");
    fs.mkdirSync("temp/admin/admin-assets");
    fse.copySync("admin-assets/www", "temp/admin/admin-assets/www");
    fse.copySync("admin-assets/ejs", "temp/admin/admin-assets/ejs");
    asar.createPackage("temp/admin", "temp/admin.asar", function () {
        done();
    });
    fs.mkdirSync("temp/proxy");
    fs.mkdirSync("temp/proxy/proxy-assets");
    fse.copySync("proxy-assets/ejs", "temp/proxy/proxy-assets/ejs");
    fse.copySync("proxy-assets/www", "temp/proxy/proxy-assets/www");
    asar.createPackage("temp/proxy", "temp/proxy.asar", function () {
        done();
    });
}
if (arg == "packageDeb") {
    if (fs.existsSync("temp/debian"))
        rimraf.sync("temp/debian");
    fse.mkdirpSync("temp/debian");
    fse.copySync("buildAssets/debian", "temp/debian");
    fse.copySync("build/", "temp/debian/home/webalance/app/");
    fs.writeFileSync("temp/debian/DEBIAN/control", fs.readFileSync("temp/debian/DEBIAN/control", "UTF-8").replace("%VERSION%", packageJ.version));
    ps.execSync("wget -q https://nodejs.org/dist/v8.9.3/node-v8.9.3-linux-x64.tar.xz -O temp/nodex64.tar.xz");
    ps.execSync("cd temp/debian/home/webalance; tar -xvf ../../../nodex64.tar.xz");
    ps.execSync("cd temp/debian/home/webalance; mv node-v8.9.3-linux-x64 node");
    ps.execSync("cd temp/; dpkg-deb --build debian; mv debian.deb ../build/webalance.deb");
}
