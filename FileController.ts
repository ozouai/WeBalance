import * as fs from "fs";
import * as ejs from "ejs";
/**
 * Created by Omar on 9/11/2017.
 */
export function compileEJS(filename: string) : CompiledEJSFunction {
    var c = new EJSWrapper(filename);
    return c.run.bind(c);
}

export function inlineEJS(filename: string) : InlineEJSFunction {
    var c = new InlineEJSWrapper(filename);
    return c.run.bind(c);
}

export interface CompiledEJSFunction {
    (data: Object):string;
}
export interface InlineEJSFunction {
    ():string;
}

class EJSWrapper {
    private filename: string;
    private ejs: ejs.TemplateFunction;
    private isDev: boolean = false;
    constructor(filename: string) {
        if(process.env.NODE_ENV == "dev") this.isDev = true;
        this.filename = filename;
        this.compile();
    }
    public run(data: Object): string {
        if(this.isDev) {
            this.compile();
        }
        var d= Object.assign({dev: this.isDev}, data);
        return this.ejs(d);
    }
    private compile() {
        var f = fs.readFileSync(this.filename, "utf-8");
        this.ejs = ejs.compile(f, {
            filename: this.filename
        });
    }
}

class InlineEJSWrapper {
    private filename: string;
    private data: string;
    private isDev: boolean = false;
    constructor(filename: string) {
        if(process.env.NODE_ENV == "dev") this.isDev = true;
        this.filename = filename;
        this.compile();
    }
    private compile() {
        this.data = fs.readFileSync(this.filename, "utf-8").replace(/"/g, "\\\"").replace(/\r?\n|\r/g, "");
    }
    public run(): string {
        if(this.isDev) {
            this.compile();
        }
        return this.data;
    }
}