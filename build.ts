import * as fs from "fs";
import * as fse from "fs-extra";
import rimraf = require("rimraf");
import asar = require("asar");
import * as ps from "child_process";
var arg = process.argv[2];
const packageJ = JSON.parse(fs.readFileSync("package.json", "UTF-8"));
if(arg == "build") {
    const MainASARFiles = [
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
    ]


    if (fs.existsSync("temp"))
        rimraf.sync("temp");

    if (fs.existsSync("build"))
        rimraf.sync("build");

    fs.mkdirSync("build");
    fs.mkdirSync("temp");
    fs.mkdirSync("temp/main");
    for (let file of MainASARFiles) {
        fs.copyFileSync(file, "temp/main/" + file);
    }


    let i = 0;

    function done() {
        i++;
        if (i >= 3) {
            fs.copyFileSync("temp/main.asar", "build/main.asar");
            fs.copyFileSync("temp/admin.asar", "build/admin.asar");
            fs.copyFileSync("temp/proxy.asar", "build/proxy.asar");
            fs.copyFileSync("launch.js", "build/launch.js");
            fs.copyFileSync("ASARInjector.js", "build/ASARInjector.js");
            fs.copyFileSync("package.json", "build/package.json");
            fs.copyFileSync("package-lock.json", "build/package-lock.json");

        }
    }

    asar.createPackage("temp/main", "temp/main.asar", () => {
        done();
    })


    fs.mkdirSync("temp/admin");
    fs.mkdirSync("temp/admin/admin-assets")
    fse.copySync("admin-assets/www", "temp/admin/admin-assets/www");
    fse.copySync("admin-assets/ejs", "temp/admin/admin-assets/ejs");
    asar.createPackage("temp/admin", "temp/admin.asar", () => {
        done();
    })


    fs.mkdirSync("temp/proxy");
    fs.mkdirSync("temp/proxy/proxy-assets");
    fse.copySync("proxy-assets/ejs", "temp/proxy/proxy-assets/ejs");
    fse.copySync("proxy-assets/www", "temp/proxy/proxy-assets/www");

    asar.createPackage("temp/proxy", "temp/proxy.asar", () => {
        done();
    });

}
if(arg == "packageDeb") {
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
