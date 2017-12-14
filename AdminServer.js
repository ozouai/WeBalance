"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var FileController = require("./FileController");
var socketio = require("socket.io");
var Stats = require("./StatsCollector");
var safeSave = require("./SafeSave");
var bcrypt = require("bcrypt");
var fs = require("fs");
var path = require("path");
var securePin = require("secure-pin");
var tokenStore = {};
if (!fs.existsSync(path.normalize(process.env.CONFIG_DIR + "/adminUsers.json"))) {
    safeSave.saveSync(path.normalize(process.env.CONFIG_DIR + "/adminUsers.json"), JSON.stringify({ root: { password: "" } }));
}
var users = JSON.parse(fs.readFileSync(path.normalize(process.env.CONFIG_DIR + "/adminUsers.json"), "UTF-8"));
function requireAuth(request, response, next) {
    var token;
    if (request.params.token)
        token = request.params.token;
    else if (request.headers.authorization) {
        var header = request.headers.authorization;
        if (header.indexOf("bearer") !== -1) {
            var d = header.split(" ");
            if (d[1]) {
                if (tokenStore[d[1]])
                    return next();
            }
        }
    }
    response.json({ error: true });
}
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
    app.get("/api/tokenTest", requireAuth, function (req, res) {
        res.json({ success: true });
    });
    app.post("/api/signin", function (req, res) {
        function fail() {
            res.json({ error: "notfound" });
        }
        function auth() {
            var user = req.body.username;
            securePin.generateString(25, securePin.defaultCharset, function (token) {
                tokenStore[token] = {
                    user: user,
                    lastUsed: new Date()
                };
                res.json({ token: token });
            });
        }
        if (!req.body.username)
            return fail();
        if (!users[req.body.username])
            return fail();
        if (users[req.body.username].password == "*")
            return auth();
        bcrypt.compare(req.body.password, users[req.body.username].password, function (err, res) {
            if (!res)
                return fail();
            if (res)
                return auth();
        });
    });
    app.get("/", function (req, res) {
        res.send(home_ejs({}));
    });
    app.get("/api/endpoints", requireAuth, function (req, res) {
        res.json(endpoints.getEndpointsWithStatus());
    });
    app.get("/api/endpoint/:id", requireAuth, function (req, res) {
        var endpoint = endpoints.locateEndpointForHost(req.params.id);
        res.json(endpoint.options || { error: "not found" });
    });
    app.put("/api/endpoint/:id", requireAuth, function (req, res) {
        endpoints.createEndpoint(req.params.id);
        res.json({ success: true });
    });
    app.patch("/api/endpoint/:id", requireAuth, function (req, res) {
        var endpoint = endpoints.locateEndpointForHost(req.params.id);
        endpoint.updateOptions(req.body, function (result) {
            if (!result.success) {
                res.statusCode = 501;
                return res.json({ errors: result.error });
            }
            res.json({ success: true });
        });
    });
    app.post("/api/endpoint/:id/targets/delete", requireAuth, function (req, res) {
        var endpoint = endpoints.locateEndpointForHost(req.params.id);
        for (var _i = 0, _a = req.body; _i < _a.length; _i++) {
            var d = _a[_i];
            endpoint.removeTarget(d);
        }
        res.json({ success: true });
    });
    app.patch("/api/endpoint/:id/targets", requireAuth, function (req, res) {
        var endpoint = endpoints.locateEndpointForHost(req.params.id);
        for (var _i = 0, _a = req.body; _i < _a.length; _i++) {
            var d = _a[_i];
            endpoint.addTarget(d);
        }
        res.json({ success: true });
    });
    app.get("/api/certs", requireAuth, function (req, res) {
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
