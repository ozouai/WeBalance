"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
process.env.CONFIG_DIR = "C:/ouiproxy/";
var CertificateStorage_1 = require("./CertificateStorage");
var httpProxy = require("http-proxy");
var http = require("http");
var https = require("https");
var path = require("path");
var EndpointManager_1 = require("./EndpointManager");
var certStore = new CertificateStorage_1.CertificateStorage();
var proxy = httpProxy.createProxyServer({});
var endpoints = new EndpointManager_1.EndpointManager();
//var acmeServ = serveStatic( path.normalize(`${process.env.CONFIG_DIR}/acme/`));
var server = http.createServer(function (request, response) {
    console.log("Got request for: " + request.headers.host);
    var check = request.url.split("/");
    console.log(check);
    if (check.length > 3) {
        if (check[1] == ".well-known" && check[2] == "acme-challenge") {
            console.log("Let's Encrypt Challenge");
            return fs.exists(path.normalize(process.env.CONFIG_DIR + "/acme/" + check[3].replace(/\./g, "")), function (exists) {
                if (!exists) {
                    response.statusCode = 404;
                    return response.end("Not Found");
                }
                else {
                    fs.readFile(path.normalize(process.env.CONFIG_DIR + "/acme/" + check[3].replace(/\./g, "")), function (err, data) {
                        console.log(err);
                        console.log(data);
                        response.end(data);
                    });
                }
            });
        }
    }
    //proxy.web(request, response, {target: "http://127.0.0.1:8080", secure: false});
    endpoints.route(request, response);
});
endpoints.addEndpoint("unifi.omarzouai.com", "https://192.168.1.173:8443", false, true, true);
server.listen(80);
server.on("upgrade", function (request, socket, head) {
    endpoints.socket(request, socket, head);
});
function leAgree(opts, agreeCb) {
    // opts = { email, domains, tosUrl }
    agreeCb(null, opts.tosUrl);
}
console.log(certStore.getDefaultKey());
var secureServer = https.createServer({
    SNICallback: certStore.SNIHook(),
    key: certStore.getDefaultKey(),
    cert: certStore.getDefaultCert()
}, function (request, response) {
    console.log("Got secure request for: " + request.headers.host);
    endpoints.routeSecure(request, response);
});
secureServer.on("upgrade", function (request, socket, head) {
    endpoints.socketSecure(request, socket, head);
});
var leHttpChallenge = require("le-challenge-fs").create({
    webrootPath: path.normalize(process.env.CONFIG_DIR + "/acme/"),
    debug: true
});
var le = require("greenlock").create({
    server: require("greenlock").productionServerUrl,
    challenges: {
        "http-01": leHttpChallenge
    },
    challengeType: "http-01",
    agreeToTerms: leAgree,
    debug: false
});
/*le.register({
    domains: ["unifi.omarzouai.com"],
    email: "omar@omarzouai.com",
    agreeTos: true,
    rsaKeySize: 2048,
    challengeType: "http-01"
}).then(function(results) {
    console.log(results);
    certStore.registerKey("unifi.omarzouai.com", results.privkey, results.cert, results.chain);
})*/
secureServer.listen(443);
