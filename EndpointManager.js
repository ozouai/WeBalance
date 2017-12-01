"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var httpProxy = require("http-proxy");
var path = require("path");
var fs = require("fs");
var EndpointManager = (function () {
    function EndpointManager() {
        this.endpoints = {};
        if (fs.existsSync(path.normalize(process.env.CONFIG_DIR + "/endpoints.json"))) {
            var d = JSON.parse(fs.readFileSync(path.normalize(process.env.CONFIG_DIR + "/endpoints.json"), "UTF-8"));
            for (var _i = 0, d_1 = d; _i < d_1.length; _i++) {
                var e = d_1[_i];
                var ne = new Endpoint(e.host, e.options);
                this.endpoints[e.host] = ne;
            }
        }
        if (!this.endpoints["default"]) {
            this.addEndpoint("default", {
                target: "http://127.0.0.1:5001",
                http: true,
                https: true,
                allowSelfSigned: true,
                enabled: true
            });
        }
    }
    EndpointManager.prototype.getEndpoints = function () {
        return Object.values(this.endpoints);
    };
    EndpointManager.prototype.addEndpoint = function (host, options) {
        var endpoint = new Endpoint(host, options);
        this.endpoints[host] = endpoint;
        this.save();
    };
    EndpointManager.prototype.route = function (request, response) {
        var endpoint = this.locateEndpointForHost(request.headers.host);
        if (endpoint.options.http) {
            endpoint.proxy.web(request, response);
        }
        else {
            if (endpoint.options.https) {
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
        var endpoint = this.locateEndpointForHost(request.headers.host);
        if (endpoint.options.https) {
            endpoint.proxy.web(request, response);
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
        endpoint.proxy.ws(request, socket, head);
    };
    EndpointManager.prototype.socketSecure = function (request, socket, head) {
        var endpoint = this.locateEndpointForHost(request.headers.host);
        endpoint.proxy.ws(request, socket, head);
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
        if (this.endpoints[host])
            return this.endpoints[host];
        return this.endpoints["default"];
    };
    return EndpointManager;
}());
exports.EndpointManager = EndpointManager;
var Endpoint = (function () {
    function Endpoint(host, options) {
        this.host = host;
        this.options = options;
        this.restart();
    }
    Endpoint.prototype.restart = function () {
        this.proxy = httpProxy.createProxyServer({
            target: this.options.target,
            secure: !this.options.allowSelfSigned
        });
    };
    Endpoint.prototype.toJSON = function () {
        return {
            host: this.host,
            options: this.options
        };
    };
    return Endpoint;
}());
exports.Endpoint = Endpoint;
