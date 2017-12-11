"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var FileController = require("./FileController");
var app = express();
var ejs_noRoute = FileController.compileEJS("proxy-assets/ejs/noRoute.ejs");
var ejs_noHosts = FileController.compileEJS("proxy-assets/ejs/noHosts.ejs");
app.use("/www", express.static("proxy-assets/www"));
app.get("/noHosts", function (req, res) {
});
app.get("*", function (req, res) {
    if (req.query["__ouiproxy_error"]) {
        if (req.query["__ouiproxy_error"] == "noHosts") {
            return res.send(ejs_noHosts({ host: req.hostname }));
        }
    }
    res.send(ejs_noRoute({ host: req.hostname }));
});
app.listen(5001);
