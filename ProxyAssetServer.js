"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var FileController = require("./FileController");
var app = express();
var ejs_noRoute = FileController.compileEJS("proxy-assets/ejs/noRoute.ejs");
app.get("*", function (req, res) {
    res.send(ejs_noRoute({ host: req.hostname }));
});
app.listen(5001);
