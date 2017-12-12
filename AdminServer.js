"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var FileController = require("./FileController");
var socketio = require("socket.io");
var Stats = require("./StatsCollector");
function bind(endpoints, certificates) {
    var app = express();
    var server = require('http').createServer(app);
    server.listen(5080);
    var io = socketio(server);
    var dispatcher = new UpdateDispatcher();
    Stats.setFinished(function (data) {
        dispatcher.digestStorageMap(data);
    });
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
    app.put("/api/endpoint/:id", function (req, res) {
        endpoints.createEndpoint(req.params.id);
        res.json({ success: true });
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
    app.post("/api/endpoint/:id/targets/delete", function (req, res) {
        var endpoint = endpoints.locateEndpointForHost(req.params.id);
        for (var _i = 0, _a = req.body; _i < _a.length; _i++) {
            var d = _a[_i];
            endpoint.removeTarget(d);
        }
        res.json({ success: true });
    });
    app.patch("/api/endpoint/:id/targets", function (req, res) {
        var endpoint = endpoints.locateEndpointForHost(req.params.id);
        for (var _i = 0, _a = req.body; _i < _a.length; _i++) {
            var d = _a[_i];
            endpoint.addTarget(d);
        }
        res.json({ success: true });
    });
    app.get("/api/certs", function (req, res) {
        res.json(certificates.getCertList());
    });
    app.get("*", function (req, res) {
        res.send(home_ejs({}));
    });
    io.on("connection", function (socket) {
        dispatcher.registerSocket(socket);
    });
}
exports.bind = bind;
var UpdateDispatcher = (function () {
    function UpdateDispatcher() {
        this.clients = [];
    }
    UpdateDispatcher.prototype.registerSocket = function (socket) {
        this.clients.push(new UpdateClient(socket, this));
    };
    UpdateDispatcher.prototype.digestStorageMap = function (map) {
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var c = _a[_i];
            c.sendStats(map);
        }
    };
    return UpdateDispatcher;
}());
var UpdateClient = (function () {
    function UpdateClient(socket, dispatcher) {
        this.socket = socket;
        this.dispatcher = dispatcher;
    }
    UpdateClient.prototype.sendStats = function (map) {
        this.socket.emit("stats", map);
    };
    UpdateClient.prototype.sendLog = function (s) {
        this.socket.emit("log", s);
    };
    return UpdateClient;
}());
