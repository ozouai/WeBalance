"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var FileController = require("./FileController");
function bind(endpoints, certificates) {
    var app = express();
    app.listen(5080);
    app.use("/www", express.static("admin-assets/www"));
    var home_ejs = FileController.compileEJS("admin-assets/ejs/home.ejs");
    app.get("/", function (req, res) {
        res.send(home_ejs({}));
    });
    app.get("/api/endpoints", function (req, res) {
        res.json(endpoints.getEndpoints());
    });
}
exports.bind = bind;
