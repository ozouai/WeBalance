import * as safeSave from "./SafeSave";
import * as fs from "fs";
import * as path from "path";
class AppConfig {
    public data: {
        letsEncryptEmail?: string
    }
    constructor() {
        if(!fs.existsSync(path.normalize(process.env.CONFIG_DIR + "/config.json"))) {
            this.data = {};
            this.save();
        } else {
            this.data =JSON.parse(fs.readFileSync(path.normalize(process.env.CONFIG_DIR + "/config.json"), "UTF-8"));
        }
    }

    public save() {
        safeSave.saveSync(path.normalize(process.env.CONFIG_DIR + "/config.json"), JSON.stringify(this.data));
    }
}


export const config = new AppConfig();