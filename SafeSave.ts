import * as fs from "fs";
export function saveSync(filename: string, content: any) {
    fs.writeFileSync(filename+"_tmp", content);
    if(fs.existsSync(filename)) {
        fs.renameSync(filename, filename+"_bak");
    }
    fs.renameSync(filename+"_tmp", filename);
}