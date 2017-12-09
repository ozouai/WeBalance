"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var FileController = require("./FileController");
function bind(endpoints, certificates) {
    var app = express();
    app.listen(5080);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use("/www", express.static("admin-assets/www"));
    var home_ejs = FileController.compileEJS("admin-assets/ejs/home.ejs");
    app.get("/", function (req, res) {
        res.send(home_ejs({}));
    });
    app.get("/api/endpoints", function (req, res) {
        res.json(endpoints.getEndpointsWithStatus());
    });
    app.get("/api/endpoint/:id", function (req, res) {
        var endpoint = endpoints.locateEndpointForHost(req.params.id);
        res.json(endpoint.options || { error: "not found" });
    });
    app.patch("/api/endpoint/:id", function (req, res) {
        var endpoint = endpoints.locateEndpointForHost(req.params.id);
        endpoint.updateOptions(req.body, function (result) {
            if (!result.success) {
                res.statusCode = 501;
                return res.json({ errors: result.error });
            }
            res.json({ success: true });
        });
    });
    app.get("/api/certs", function (req, res) {
        res.json(certificates.getCertList());
    });
    app.get("*", function (req, res) {
        res.send(home_ejs({}));
    });
}
exports.bind = bind;
