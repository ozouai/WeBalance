import "./ASARInjector";
import * as fs from "fs";

import heapdump  = require("heapdump");

/*setInterval(()=>{
    heapdump.writeSnapshot("heaps/"+Date.now()+".heapsnapshot");
}, 60*1000);
heapdump.writeSnapshot("heaps/"+Date.now()+".heapsnapshot");*/
process.env.CONFIG_DIR = "C:/ouiproxy/";

import * as winston from "winston";
winston.setLevels({
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5
});
winston.loggers.add("SSL", {
    console: {
        level: 'silly',
        colorize: true,
        label: "Certificate Manager"
    }
});
winston.loggers.add("Endpoint", {
    console: {
        level: 'silly',
        colorize: true,
        label: "Endpoint"
    }
})
winston.loggers.add("EndpointManager", {
    console: {
        level: 'silly',
        colorize: true,
        label: "Endpoint Manager"
    }
})
import {CertificateStorage} from "./CertificateStorage";
import * as httpProxy from "http-proxy";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import * as serveStatic from "serve-static";
import {EndpointManager} from "./EndpointManager";
import "./ProxyAssetServer";
import * as AdminServer from "./AdminServer";
import * as LetsEncrypt from "./LetsEncryptAgent";
var certStore = new CertificateStorage();
var proxy = httpProxy.createProxyServer({});

const leAgent = new LetsEncrypt.LetsEncryptAgent(certStore);
var endpoints = new EndpointManager(certStore, leAgent);
//var acmeServ = serveStatic( path.normalize(`${process.env.CONFIG_DIR}/acme/`));
var server = http.createServer(function(request, response) {
    var check = request.url.split("/");
    if(check.length > 3) {
        if (check[1] == ".well-known" && check[2] == "acme-challenge") {
            return fs.exists( path.normalize(`${process.env.CONFIG_DIR}/acme/${check[3].replace(/\./g, "")}`), (exists)=>{
                if(!exists) {
                    response.statusCode = 404;
                    return response.end("Not Found");
                } else {
                    fs.readFile( path.normalize(`${process.env.CONFIG_DIR}/acme/${check[3].replace(/\./g, "")}`), (err, data)=> {
                        console.log(err);
                        console.log(data);
                        response.end(data);
                    });
                }
            })
        }
    }
    //proxy.web(request, response, {target: "http://127.0.0.1:8080", secure: false});
    endpoints.route(request, response);
});


server.listen(80);

server.on("upgrade", function(request, socket, head){
    endpoints.socket(request, socket, head);
})

var secureServer = https.createServer({
    SNICallback: certStore.SNIHook(),
    key: certStore.getDefaultKey(),
    cert: certStore.getDefaultCert()
}, function(request, response) {
    //console.log("Got secure request for: "+request.headers.host);
    endpoints.routeSecure(request, response);
});

secureServer.on("upgrade", function(request, socket, head){
    endpoints.socketSecure(request, socket, head);
})

AdminServer.bind(endpoints, certStore);

secureServer.listen(443);
