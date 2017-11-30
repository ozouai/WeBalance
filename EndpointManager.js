"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var httpProxy = require("http-proxy");
var EndpointManager = (function () {
    function EndpointManager() {
        this.endpoints = {};
    }
    EndpointManager.prototype.addEndpoint = function (host, target, http, https, allowSelfSigned) {
        var endpoint = new Endpoint(host, target, http, https, allowSelfSigned);
        this.endpoints[host] = endpoint;
    };
    EndpointManager.prototype.route = function (request, response) {
        var endpoint = this.locateEndpointForHost(request.headers.host);
        if (endpoint.allowHTTP) {
            endpoint.proxy.web(request, response);
        }
        else {
            if (endpoint.allowHTTPS) {
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
        if (endpoint.allowHTTPS) {
            endpoint.proxy.web(request, response);
        }
        else {
            if (endpoint.allowHTTP) {
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
    EndpointManager.prototype.locateEndpointForHost = function (host) {
        return this.endpoints[host];
    };
    return EndpointManager;
}());
exports.EndpointManager = EndpointManager;
var Endpoint = (function () {
    function Endpoint(host, target, allowHTTP, allowHTTPS, allowSelfSigned) {
        this.host = host;
        this.target = target;
        this.allowHTTP = allowHTTP;
        this.allowHTTPS = allowHTTPS;
        this.allowSelfSigned = allowSelfSigned;
        this.proxy = httpProxy.createProxyServer({
            target: this.target,
            secure: !this.allowSelfSigned
        });
    }
    return Endpoint;
}());
exports.Endpoint = Endpoint;
