"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var vm2 = require("vm2");
var permissions = {
    "web": {
        externalModules: ["axios", "follow-redirects", "is-buffer", "debug"],
        builtinModules: ["http", "https"]
    }
};
var plugins = [];
var pluginMap = {};
fs.readdirSync("plugins").forEach(function (file) {
    try {
        var json = JSON.parse(fs.readFileSync("plugins/" + file + "/manifest.json", "UTF-8"));
        console.log(json);
        loadPlugin(json, "plugins/" + file + "/index.js");
    }
    catch (e) {
        console.log(e);
    }
});
function loadPlugin(manifest, indexPath) {
    var externalModules = ["@webalance/ts-plugin-definitions"];
    var builtinModules = [];
    for (var _i = 0, _a = manifest.permissions; _i < _a.length; _i++) {
        var perm = _a[_i];
        if (permissions[perm]) {
            for (var _b = 0, _c = permissions[perm].externalModules; _b < _c.length; _b++) {
                var p = _c[_b];
                if (externalModules.indexOf(p) === -1)
                    externalModules.push(p);
            }
            for (var _d = 0, _e = permissions[perm].builtinModules; _d < _e.length; _d++) {
                var p = _e[_d];
                if (builtinModules.indexOf(p) === -1)
                    builtinModules.push(p);
            }
        }
    }
    var vm = new vm2.NodeVM({
        console: "inherit",
        sandbox: {},
        require: {
            context: 'sandbox',
            external: externalModules,
            builtin: builtinModules,
            root: "./"
        }
    });
    var plugin = vm.run(fs.readFileSync(indexPath, "UTF-8"), indexPath);
    plugins.push({
        vm: vm,
        plugin: plugin
    });
    pluginMap[manifest.name] = {
        vm: vm,
        plugin: plugin
    };
}
exports.loadPlugin = loadPlugin;
function getAdminBlocks() {
    var pages = [];
    for (var _i = 0, plugins_1 = plugins; _i < plugins_1.length; _i++) {
        var plugin = plugins_1[_i];
        if (plugin.plugin.webInterface) {
            pages.push(plugin.plugin.webInterface);
        }
    }
    return pages;
}
exports.getAdminBlocks = getAdminBlocks;
function getPluginList() {
    return Object.keys(pluginMap);
}
exports.getPluginList = getPluginList;
function getPluginAdminList() {
    var results = [];
    for (var _i = 0, _a = Object.keys(pluginMap); _i < _a.length; _i++) {
        var key = _a[_i];
        var plugin = pluginMap[key];
        if (plugin.plugin.webInterface) {
            results.push({
                id: key,
                name: plugin.plugin.webInterface.name
            });
        }
    }
    return results;
}
exports.getPluginAdminList = getPluginAdminList;
function getPluginByName(name) {
    return pluginMap[name].plugin;
}
exports.getPluginByName = getPluginByName;
