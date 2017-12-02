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
                var ne = new Endpoint(e.host, this, e.options);
                this.endpoints[e.host] = ne;
            }
        }
        if (!this.endpoints["default"]) {
            this.addEndpoint("default", {
                targets: ["http://127.0.0.1:5001"],
                http: true,
                https: true,
                allowSelfSigned: true,
                enabled: true,
                routingStrategy: "roundRobin"
            });
        }
    }
    EndpointManager.prototype.getEndpoints = function () {
        return Object.values(this.endpoints);
    };
    EndpointManager.prototype.addEndpoint = function (host, options) {
        var endpoint = new Endpoint(host, this, options);
        this.endpoints[host] = endpoint;
        this.save();
    };
    EndpointManager.prototype.route = function (request, response) {
        var endpoint = this.locateEndpointForHost(request.headers.host);
        if (endpoint.options.http) {
            endpoint.route(request, response);
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
        if (this.endpoints[host])
            return this.endpoints[host];
        return this.endpoints["default"];
    };
    return EndpointManager;
}());
exports.EndpointManager = EndpointManager;
var Endpoint = (function () {
    function Endpoint(host, endpointContainer, options) {
        this.proxies = [];
        this.roundRobinIndex = 0;
        this.roundRobinSocketIndex = 0;
        this.host = host;
        this.options = options;
        this.endpointContainer = endpointContainer;
        this.restart();
    }
    Endpoint.prototype.route = function (request, response) {
        if (!this.hasAliveHosts()) {
            return this.endpointContainer.locateEndpointForHost("default").route(request, response);
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
        this.route(request, response);
    };
    Endpoint.prototype.retrySocket = function (request, socket, head) {
    };
    return Endpoint;
}());
exports.Endpoint = Endpoint;
var ProxyNode = (function () {
    function ProxyNode(target, allowSelfSigned, endpoint) {
        this.target = target;
        this.allowSelfSigned = allowSelfSigned;
        this.alive = true;
        this.endpoint = endpoint;
        this.proxy = httpProxy.createProxyServer({
            target: this.target,
            secure: !this.allowSelfSigned
        });
    }
    ProxyNode.prototype.web = function (request, response) {
        var _this = this;
        this.proxy.web(request, response, {}, function (e) {
            if (e) {
                console.log(e);
                _this.alive = false;
                _this.endpoint.retry(request, response);
            }
        });
    };
    ProxyNode.prototype.ws = function (request, socket, head) {
        this.proxy.ws(request, socket, head);
    };
    return ProxyNode;
}());
