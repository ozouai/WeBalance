"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var ejs = require("ejs");
/**
 * Created by Omar on 9/11/2017.
 */
function compileEJS(filename) {
    var c = new EJSWrapper(filename);
    return c.run.bind(c);
}
exports.compileEJS = compileEJS;
function inlineEJS(filename) {
    var c = new InlineEJSWrapper(filename);
    return c.run.bind(c);
}
exports.inlineEJS = inlineEJS;
var EJSWrapper = (function () {
    function EJSWrapper(filename) {
        this.isDev = false;
        if (process.env.NODE_ENV == "dev")
            this.isDev = true;
        this.filename = filename;
        this.compile();
    }
    EJSWrapper.prototype.run = function (data) {
        if (this.isDev) {
            this.compile();
        }
        var d = Object.assign({ dev: this.isDev }, data);
        return this.ejs(d);
    };
    EJSWrapper.prototype.compile = function () {
        var f = fs.readFileSync(this.filename, "utf-8");
        this.ejs = ejs.compile(f, {
            filename: this.filename
        });
    };
    return EJSWrapper;
}());
var InlineEJSWrapper = (function () {
    function InlineEJSWrapper(filename) {
        this.isDev = false;
        if (process.env.NODE_ENV == "dev")
            this.isDev = true;
        this.filename = filename;
        this.compile();
    }
    InlineEJSWrapper.prototype.compile = function () {
        this.data = fs.readFileSync(this.filename, "utf-8").replace(/"/g, "\\\"").replace(/\r?\n|\r/g, "");
    };
    InlineEJSWrapper.prototype.run = function () {
        if (this.isDev) {
            this.compile();
        }
        return this.data;
    };
    return InlineEJSWrapper;
}());
