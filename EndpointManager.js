"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var httpProxy = require("http-proxy");
var path = require("path");
var fs = require("fs");
var winston = require("winston");
var securePin = require("secure-pin");
var crypto = require("crypto");
var http = require("http");
var https = require("https");
var url = require("url");
require("./SharedInterfaces");
var charset = new securePin.CharSet();
var StatsCollector_1 = require("./StatsCollector");
charset.addNumeric().addUpperCaseAlpha().addLowerCaseAlpha().randomize();
var endpointLogger = winston.loggers.get("Endpoint");
var managerLogger = winston.loggers.get("EndpointManager");
var EndpointManager = (function () {
    function EndpointManager(certStore, letsEncrypt) {
        this.endpoints = {};
        this.certStore = certStore;
        this.letsEncrypt = letsEncrypt;
        if (fs.existsSync(path.normalize(process.env.CONFIG_DIR + "/endpoints.json"))) {
            var d = JSON.parse(fs.readFileSync(path.normalize(process.env.CONFIG_DIR + "/endpoints.json"), "UTF-8"));
            for (var _i = 0, d_1 = d; _i < d_1.length; _i++) {
                var e = d_1[_i];
                var ne = new Endpoint(e.host, this, e.options);
                this.endpoints[e.host] = ne;
                if (!ne.options.sslCert) {
                    this.certStore.addCertToDomain(e.host, "default");
                    console.log("Setting to default");
                }
                else if (ne.options.sslCert != "default") {
                    this.certStore.addCertToDomain(e.host, ne.options.sslCert);
                }
                else {
                    this.certStore.addCertToDomain(e.host, "default");
                }
            }
        }
        if (!this.endpoints["default"]) {
            this.addEndpoint("default", {
                targets: ["http://127.0.0.1:5001"],
                http: true,
                https: true,
                allowSelfSigned: true,
                enabled: true,
                routingStrategy: "roundRobin",
                sslCert: "default",
                authorization: "none",
                friendlyName: "Default Endpoint",
                users: {}
            });
        }
        this.endpoints["default"].isDefault = true;
    }
    EndpointManager.prototype.getEndpoints = function () {
        return Object.values(this.endpoints);
    };
    EndpointManager.prototype.getEndpointsWithStatus = function () {
        var r = [];
        for (var _i = 0, _a = Object.keys(this.endpoints); _i < _a.length; _i++) {
            var key = _a[_i];
            var end = this.endpoints[key];
            r.push({
                endpoint: key,
                friendlyName: end.options.friendlyName || key,
                targetsAlive: end.countAliveHosts(),
                targets: end.options.targets.length,
                errors: []
            });
        }
        return r;
    };
    EndpointManager.prototype.addEndpoint = function (host, options) {
        var endpoint = new Endpoint(host, this, options);
        this.endpoints[host] = endpoint;
        this.save();
    };
    EndpointManager.prototype.route = function (request, response) {
        var start = process.hrtime();
        request.profiler = {};
        request.profiler.start = process.hrtime();
        var endpoint = this.locateEndpointForRequest(request);
        if (endpoint.options.http) {
            endpoint.route(request, response);
        }
        else {
            if (endpoint.options.https) {
                endpointLogger.error("Requested HTTP for HTTPS site '" + request.headers.host + "', redirecting to HTTPS. " + request.connection.remoteAddress);
                response.setHeader("Location", "https://" + request.headers.host + "/" + (request.url || ""));
                response.statusCode = 302;
                response.end();
            }
            else {
                // Send to Default Endpoint
                response.end("Can't find a valid route");
            }
        }
    };
    EndpointManager.prototype.routeSecure = function (request, response) {
        request.profiler = {};
        request.profiler.start = process.hrtime();
        var endpoint = this.locateEndpointForRequest(request);
        if (endpoint.options.https) {
            endpoint.route(request, response);
        }
        else {
            if (endpoint.options.http) {
                response.setHeader("Location", "http://" + request.headers.host + "/" + (request.url || ""));
                response.statusCode = 302;
                response.end();
            }
            else {
                // Send to Default Endpoint
                response.end("Can't find a valid route");
            }
        }
    };
    EndpointManager.prototype.socket = function (request, socket, head) {
        var endpoint = this.locateEndpointForHost(request.headers.host);
        endpoint.routeSocket(request, socket, head);
    };
    EndpointManager.prototype.socketSecure = function (request, socket, head) {
        var endpoint = this.locateEndpointForHost(request.headers.host);
        endpoint.routeSocket(request, socket, head);
    };
    EndpointManager.prototype.save = function () {
        var e = [];
        for (var _i = 0, _a = Object.keys(this.endpoints); _i < _a.length; _i++) {
            var key = _a[_i];
            var end = this.endpoints[key];
            e.push(end.toJSON());
        }
        fs.writeFileSync(path.normalize(process.env.CONFIG_DIR + "/endpoints.json"), JSON.stringify(e));
    };
    EndpointManager.prototype.locateEndpointForHost = function (host) {
        return this.endpoints[host];
    };
    EndpointManager.prototype.locateEndpointForRequest = function (request) {
        if (this.endpoints[request.headers.host])
            return this.endpoints[request.headers.host];
        else {
            managerLogger.error("Can't find endpoint for '" + request.headers.host + "', using default | " + printRequest(request));
            return this.endpoints["default"];
        }
    };
    return EndpointManager;
}());
exports.EndpointManager = EndpointManager;
function md5(data) {
    return crypto.createHash("md5").update(data).digest("hex");
}
var opaque = md5("Secure Area");
var digestRegex = /([a-zA-Z]+)="(.*?)"/;
var cnonceRegex = /nc=([0-9a-z]+)/;
var Endpoint = (function () {
    function Endpoint(host, endpointContainer, options) {
        this.proxies = [];
        this.roundRobinIndex = 0;
        this.roundRobinSocketIndex = 0;
        this.isDefault = false;
        this.host = host;
        this.options = options;
        this.endpointContainer = endpointContainer;
        this.restart();
    }
    Endpoint.prototype.updateOptions = function (newTree, cb) {
        var errors = [];
        for (var _i = 0, _a = Object.keys(newTree); _i < _a.length; _i++) {
            var key = _a[_i];
            switch (key) {
                case "sslCert":
                    if (newTree[key] != "default" && newTree[key] != "letsEncrypt") {
                        if (!this.endpointContainer.certStore.hasCertForKey(newTree[key])) {
                            errors.push("'sslCert' not found");
                        }
                    }
                    break;
                case "http":
                    if (typeof newTree[key] != "boolean")
                        errors.push("'http' invalid setting");
                    break;
                case "https":
                    if (typeof newTree[key] != "boolean")
                        errors.push("'https' invalid setting");
                case "allowSelfSigned":
                    if (typeof newTree[key] != "boolean")
                        errors.push("'allowSelfSigned' invalid setting");
                    break;
                case "authorization":
                    if (typeof newTree[key] != "string")
                        errors.push("'authorization' invalid setting");
                    else {
                        if (newTree[key] != "none" && newTree[key] != "basic" && newTree[key] != "digest")
                            errors.push("'authorization' invalid setting");
                    }
                    break;
                case "friendlyName":
                    if (typeof newTree[key] != "string")
                        errors.push("'friendlyName' invalid setting");
                    break;
            }
        }
        if (errors.length > 0) {
            return cb({ success: false, error: errors });
        }
        for (var _b = 0, _c = Object.keys(newTree); _b < _c.length; _b++) {
            var key = _c[_b];
            switch (key) {
                case "sslCert":
                    if (newTree[key] == "letsEncrypt") {
                        this.endpointContainer.letsEncrypt.register(this.host, "", function (e) {
                        });
                    }
                    else if (newTree[key] == "default") {
                        this.options.sslCert = "default";
                        this.endpointContainer.certStore.addCertToDomain(this.host, "default");
                    }
                    else {
                        this.options.sslCert = newTree[key];
                        this.endpointContainer.certStore.addCertToDomain(this.host, newTree[key]);
                    }
                    break;
                case "http":
                    this.options.http = newTree[key];
                    break;
                case "https":
                    this.options.https = newTree[key];
                    break;
                case "allowSelfSigned":
                    this.options.allowSelfSigned = newTree[key];
                    break;
                case "friendlyName":
                    this.options.friendlyName = newTree[key];
                    break;
            }
        }
        this.endpointContainer.save();
        return cb({ success: true, error: [] });
    };
    Endpoint.prototype.failAuth = function (request, response) {
        response.statusCode = 401;
        if (this.options.authorization == "basic") {
            response.setHeader("WWW-Authenticate", "Basic realm=\"Secure Area\"");
            response.end("<!DOCTYPE html><html><body>Authorization Required</body></html>");
            return;
        }
        if (this.options.authorization == "digest") {
            return securePin.generateString(20, charset, function (nonce) {
                response.setHeader("WWW-Authenticate", "Digest realm=\"Secure Area\",qop=\"auth\",nonce=\"" + nonce + "\",opaque=\"" + opaque + "\"");
                response.end("<!DOCTYPE html><html><body>Authorization Required</body></html>");
                return;
            });
        }
    };
    Endpoint.prototype.route = function (request, response) {
        if (!request.profiler)
            request.profiler = { start: process.hrtime() };
        request.profiler.host = this.host;
        if (this.options.authorization && this.options.authorization != "none") {
            if (!request.headers["authorization"]) {
                return this.failAuth(request, response);
            }
            else {
                if (!this.options.users) {
                    endpointLogger.error("No Users"); //TODO better error
                    response.end("No Users");
                    return;
                }
                var header = request.headers["authorization"];
                var method = header.split(" ")[0];
                console.log(header);
                if (this.options.authorization == "basic") {
                    if (method.toLowerCase().trim() != "basic")
                        return this.failAuth(request, response);
                    var base = header[1];
                    var debased = new Buffer(base, "base64").toString().split(":");
                    var username = debased[0];
                    var password = debased[1];
                    if (!this.options.users[username])
                        return this.failAuth(request, response);
                    if (this.options.users[username].password != password)
                        return this.failAuth(request, response);
                    request.username = username;
                }
                else if (this.options.authorization == "digest") {
                    if (method.toLowerCase().trim() != "digest")
                        return this.failAuth(request, response);
                    var r_result = digestRegex.exec(header);
                    var data = {};
                    while (r_result) {
                        data[r_result[1]] = r_result[2];
                        header = header.replace(r_result[0], "");
                        r_result = digestRegex.exec(header);
                    }
                    data["nonceCount"] = cnonceRegex.exec(header)[1];
                    if (!this.options.users[data["username"]])
                        return this.failAuth(request, response);
                    var ha1 = md5(data["username"] + ":" + "Secure Area" + ":" + this.options.users[data["username"]].password);
                    var ha2 = md5(request.method + ":" + request.url);
                    var hash = md5(ha1 + ":" + data["nonce"] + ":" + data["nonceCount"] + ":" + data["cnonce"] + ":" + "auth" + ":" + ha2);
                    if (hash != data["response"]) {
                        return this.failAuth(request, response);
                    }
                }
                else {
                    return this.failAuth(request, response);
                    ;
                }
                request.headers.authorization = null;
                request.headers["authorization"] = null;
                request.rawHeaders.splice(request.rawHeaders.indexOf("Authorization"), 2);
            }
        }
        if (!this.hasAliveHosts()) {
            if (!this.isDefault)
                return this.endpointContainer.locateEndpointForHost("default").route(request, response);
            response.statusCode = 500;
            return response.end("No routes available");
        }
        if (this.options.routingStrategy == "roundRobin") {
            this.roundRobinRoute(request, response);
        }
    };
    Endpoint.prototype.routeSocket = function (request, socket, head) {
        if (!this.hasAliveHosts()) {
            socket.close();
        }
        if (this.options.routingStrategy == "roundRobin") {
            this.roundRobinSocketRoute(request, socket, head);
        }
    };
    Endpoint.prototype.roundRobinRoute = function (request, response) {
        while (!this.proxies[this.roundRobinIndex].alive) {
            this.roundRobinIndex++;
            if (this.roundRobinIndex >= this.proxies.length) {
                this.roundRobinIndex = 0;
            }
        }
        this.proxies[this.roundRobinIndex].web(request, response);
        this.roundRobinIndex++;
        if (this.roundRobinIndex >= this.proxies.length) {
            this.roundRobinIndex = 0;
        }
    };
    Endpoint.prototype.roundRobinSocketRoute = function (request, socket, head) {
        while (!this.proxies[this.roundRobinSocketIndex].alive) {
            this.roundRobinSocketIndex++;
            if (this.roundRobinSocketIndex >= this.proxies.length) {
                this.roundRobinSocketIndex = 0;
            }
        }
        this.proxies[this.roundRobinSocketIndex].ws(request, socket, head);
        this.roundRobinSocketIndex++;
        if (this.roundRobinSocketIndex >= this.proxies.length) {
            this.roundRobinSocketIndex = 0;
        }
    };
    Endpoint.prototype.hasAliveHosts = function () {
        for (var _i = 0, _a = this.proxies; _i < _a.length; _i++) {
            var node = _a[_i];
            if (node.alive)
                return true;
        }
        return false;
    };
    Endpoint.prototype.countAliveHosts = function () {
        var alive = 0;
        for (var _i = 0, _a = this.proxies; _i < _a.length; _i++) {
            var node = _a[_i];
            if (node.alive)
                alive++;
        }
        return alive;
    };
    Endpoint.prototype.restart = function () {
        this.proxies = [];
        for (var _i = 0, _a = this.options.targets; _i < _a.length; _i++) {
            var target = _a[_i];
            this.proxies.push(new ProxyNode(target, this.options.allowSelfSigned, this));
        }
    };
    Endpoint.prototype.toJSON = function () {
        return {
            host: this.host,
            options: this.options
        };
    };
    Endpoint.prototype.retry = function (request, response) {
        if (!this.isDefault)
            return this.route(request, response);
        response.statusCode = 500;
        response.end("No routes available");
    };
    Endpoint.prototype.retrySocket = function (request, socket, head) {
    };
    return Endpoint;
}());
exports.Endpoint = Endpoint;
var ProxyNode = (function () {
    function ProxyNode(target, allowSelfSigned, endpoint) {
        this.rescanTime = 60;
        this.target = target;
        this.allowSelfSigned = allowSelfSigned;
        this.alive = false;
        this.endpoint = endpoint;
        this.rescan();
    }
    ProxyNode.prototype.reloadProxy = function () {
        var _this = this;
        this.proxy = httpProxy.createProxyServer({
            target: this.target,
            secure: !this.allowSelfSigned
        });
        this.logTarget = this.target.replace("http://", "").replace("https://", "");
        this.proxy.on("proxyRes", function (proxyRes, request, response) {
            endpointLogger.info(_this.endpoint.host + " " + request.connection.remoteAddress + " " + _this.logTarget + " " + (request.username || "-") + " " + new Date().toISOString() + " \"" + (request.method + " " + request.url + " HTTP/" + request.httpVersion) + "\" " + proxyRes.statusCode + " - " + (request.headers.referer ? "\"" + request.headers.referer + "\"" : "-") + " " + (request.headers["user-agent"] ? "\"" + request.headers["user-agent"] + "\"" : "-"));
            request.profiler.proxyEnd = process.hrtime(request.profiler.proxyStart);
            request.profiler.end = process.hrtime(request.profiler.start);
            request.profiler.responseCode = proxyRes.statusCode;
            StatsCollector_1.profile(request);
            if (proxyRes.statusCode == 500) {
                _this.errors.push("500 error");
            }
        });
        this.proxy.on("error", function (e, request, response) {
            console.log(e);
            _this.alive = false;
            _this.scheduleRescan();
            _this.endpoint.retry(request, response);
        });
    };
    ProxyNode.prototype.scheduleRescan = function () {
        var _this = this;
        this.rescanTimer = setInterval(function () {
            _this.rescan();
        }, this.rescanTime * 1000);
    };
    ProxyNode.prototype.rescan = function () {
        var _this = this;
        var theURL = url.parse(this.target);
        if (theURL.protocol == "https:") {
            https.request({
                method: "head",
                hostname: theURL.hostname,
                port: theURL.port || 443,
                path: "/",
                rejectUnauthorized: !this.allowSelfSigned,
            }, function (res) {
                _this.alive = true;
                _this.reloadProxy();
            }).on("error", function (e) {
                console.log(e);
                _this.alive = false;
                _this.scheduleRescan();
            }).end();
        }
        if (theURL.protocol == "http:") {
            http.request({
                method: "head",
                hostname: theURL.hostname,
                port: theURL.port || 80,
                path: "/"
            }, function (res) {
                _this.alive = true;
                _this.reloadProxy();
            }).on("error", function (e) {
                console.log(e);
                _this.alive = false;
                _this.scheduleRescan();
            }).end();
        }
    };
    ProxyNode.prototype.web = function (request, response) {
        request.profiler.target = this.target;
        request.profiler.proxyStart = process.hrtime();
        this.proxy.web(request, response);
    };
    ProxyNode.prototype.ws = function (request, socket, head) {
        this.proxy.ws(request, socket, head);
    };
    return ProxyNode;
}());
function printRequest(request) {
    return (request.connection.remoteAddress || "-") + " " + (request.url || "-");
}
