import * as fs from "fs";
import {Plugin, WebInterface_BlockTypes} from "@webalance/ts-plugin-definitions";
import vm2 = require("vm2");
const permissions : PermissionDeclarations = {
    "web": {
        externalModules: ["axios", "follow-redirects", "is-buffer", "debug"],
        builtinModules: ["http", "https"]
    }
}


const plugins : Array<{
    vm: vm2.NodeVM,
    plugin: Plugin
}> = [];

const pluginMap: {
    [key: string]: {
        vm: vm2.NodeVM,
        plugin: Plugin
    }
} = {};

fs.readdirSync("plugins").forEach((file)=>{
    try {
        let json = JSON.parse(fs.readFileSync("plugins/"+file+"/manifest.json", "UTF-8"));
        console.log(json);
        loadPlugin(json, "plugins/"+file+"/index.js");
    } catch(e) {
        console.log(e);
    }
});


export function loadPlugin(manifest: any, indexPath: string) {
    let externalModules = ["@webalance/ts-plugin-definitions"];
    let builtinModules = [];

    for(let perm of manifest.permissions) {
        if(permissions[perm]) {
            for(let p of permissions[perm].externalModules) {
                if(externalModules.indexOf(p) === -1)
                    externalModules.push(p);
            }
            for(let p of permissions[perm].builtinModules) {
                if(builtinModules.indexOf(p) === -1)
                    builtinModules.push(p);
            }
        }
    }

    let vm = new vm2.NodeVM({
        console: "inherit",
        sandbox: {},
        require: {
            context: 'sandbox',
            external: externalModules,
            builtin: builtinModules,
            root: "./"
        }
    });
    let plugin : Plugin = vm.run(fs.readFileSync(indexPath, "UTF-8"), indexPath);
    plugins.push({
        vm: vm,
        plugin: plugin
    });
    pluginMap[manifest.name] = {
        vm: vm,
        plugin: plugin
    };
}


export function getAdminBlocks() {
    let pages = [];
    for(let plugin of plugins) {
        if(plugin.plugin.webInterface) {
            pages.push(plugin.plugin.webInterface);
        }
    }
    return pages;
}

export function getPluginList():Array<string> {
    return Object.keys(pluginMap);
}

export function getPluginAdminList():Array<{id: string, name: string}> {
    let results = [];
    for(let key of Object.keys(pluginMap)) {
        let plugin = pluginMap[key];
        if(plugin.plugin.webInterface) {
            results.push({
                id: key,
                name: plugin.plugin.webInterface.name
            })
        }
    }
    return results;
}

export function getPluginByName(name: string): Plugin {
    return pluginMap[name].plugin;
}

interface PermissionDeclaration {
    externalModules: Array<string>;
    builtinModules: Array<string>;
}

interface PermissionDeclarations {
    [key: string]: PermissionDeclaration;
}