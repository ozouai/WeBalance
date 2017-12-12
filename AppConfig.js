"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var safeSave = require("./SafeSave");
var fs = require("fs");
var path = require("path");
var AppConfig = (function () {
    function AppConfig() {
        if (!fs.existsSync(path.normalize(process.env.CONFIG_DIR + "/config.json"))) {
            this.data = {};
            this.save();
        }
        else {
            this.data = JSON.parse(fs.readFileSync(path.normalize(process.env.CONFIG_DIR + "/config.json"), "UTF-8"));
        }
    }
    AppConfig.prototype.save = function () {
        safeSave.saveSync(path.normalize(process.env.CONFIG_DIR + "/config.json"), JSON.stringify(this.data));
    };
    return AppConfig;
}());
exports.config = new AppConfig();
