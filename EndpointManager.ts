import * as httpProxy from "http-proxy";
import * as path from "path";
import * as fs from "fs";
import * as winston from "winston";
import * as securePin from "secure-pin";
import * as crypto from "crypto";
const charset = new securePin.CharSet();
charset.addNumeric().addUpperCaseAlpha().addLowerCaseAlpha().randomize();
import {IncomingMessage, ServerResponse} from "http";
import {md} from "node-forge";
const endpointLogger = winston.loggers.get("Endpoint");
const managerLogger = winston.loggers.get("EndpointManager");

export class EndpointManager {
    private endpoints: {
        [key: string]: Endpoint
    } = {};

    constructor() {
        if(fs.existsSync(path.normalize(`${process.env.CONFIG_DIR}/endpoints.json`))) {
            let d = JSON.parse(fs.readFileSync(path.normalize(`${process.env.CONFIG_DIR}/endpoints.json`), "UTF-8"));
            for(let e of d) {
                let ne = new Endpoint(e.host,this, e.options);
                this.endpoints[e.host] = ne;
            }
        }
        if(!this.endpoints["default"]) {
            this.addEndpoint("default", {
                targets: ["http://127.0.0.1:5001"],
                http:true,
                https:true,
                allowSelfSigned: true,
                enabled: true,
                routingStrategy: "roundRobin"
            });
        }
    }

    public getEndpoints(): Array<Endpoint> {
        return (Object as any).values(this.endpoints);
    }

    public addEndpoint(host: string, options: EndpointOptions) {
        let endpoint = new Endpoint(host, this, options);
        this.endpoints[host] = endpoint;
        this.save();
    }

    public route(request, response) {
        let endpoint = this.locateEndpointForRequest(request);
        if(endpoint.options.http) {
            endpoint.route(request, response);
        } else {
            if(endpoint.options.https) {
                endpointLogger.error("Requested HTTP for HTTPS site '"+request.headers.host+"', redirecting to HTTPS. "+request.connection.remoteAddress);
                response.setHeader("Location", `https://${request.headers.host}/${request.url || ""}`);
                response.statusCode = 302;
                response.end();
            } else {
                // Send to Default Endpoint
                response.end("Can't find a valid route");
            }
        }
    }

    public routeSecure(request, response) {
        let endpoint = this.locateEndpointForRequest(request);
        if(endpoint.options.https) {
            endpoint.route(request, response);
        } else {
            if(endpoint.options.http) {
                response.setHeader("Location", `http://${request.headers.host}/${request.url || ""}`);
                response.statusCode = 302;
                response.end();
            } else {
                // Send to Default Endpoint
                response.end("Can't find a valid route");
            }
        }
    }

    public socket(request, socket, head) {
        let endpoint = this.locateEndpointForHost(request.headers.host);
        endpoint.routeSocket(request, socket, head);
    }

    public socketSecure(request, socket, head) {
        let endpoint = this.locateEndpointForHost(request.headers.host);
        endpoint.routeSocket(request, socket, head);
    }

    public save() {
        let e = [];
        for(var key of Object.keys(this.endpoints)) {
            let end = this.endpoints[key];
            e.push(end.toJSON());
        }
        fs.writeFileSync(path.normalize(`${process.env.CONFIG_DIR}/endpoints.json`), JSON.stringify(e));
    }

    public locateEndpointForHost(host: string) : Endpoint {
        if(this.endpoints[host]) return this.endpoints[host];
        return this.endpoints["default"];
    }
    public locateEndpointForRequest(request: any) {
        if(this.endpoints[request.headers.host]) return this.endpoints[request.headers.host];
        else {
            managerLogger.error("Can't find endpoint for '"+request.headers.host+"', using default | "+printRequest(request));
            return this.endpoints["default"];
        }
    }
}

export interface BasicUser {
    username: string;
    password: string;
}

export interface EndpointOptions{
    targets: Array<string>;
    http: boolean;
    https: boolean;
    allowSelfSigned: boolean;
    enabled: boolean;
    routingStrategy: "roundRobin",
    authorization: "none" | "basic" | "digest";
    users: {
        [key: string]: BasicUser
    }
}
function md5(data: any) {
    return crypto.createHash("md5").update(data).digest("hex");
}
const opaque = md5("Secure Area");
const digestRegex = /([a-zA-Z]+)="(.*?)"/;
const cnonceRegex = /nc=([0-9a-z]+)/;
export class Endpoint {
    public host: string;
    public options: EndpointOptions;
    public endpointContainer: EndpointManager;
    private proxies: Array<ProxyNode> = [];
    private roundRobinIndex = 0;
    private roundRobinSocketIndex = 0;
    private nonces: {
        [key: string]: {

        }
    }
    constructor(host: string, endpointContainer: EndpointManager, options: EndpointOptions) {
        this.host = host;
        this.options = options;
        this.endpointContainer = endpointContainer;
        this.restart();
    }

    private failAuth(request: IncomingMessage, response: ServerResponse) {
        response.statusCode = 401;
        if(this.options.authorization == "basic") {
            response.setHeader("WWW-Authenticate", "Basic realm=\"Secure Area\"");
            response.end("<!DOCTYPE html><html><body>Authorization Required</body></html>");
            return;
        }
        if(this.options.authorization == "digest") {
            return securePin.generateString(20, charset, (nonce)=>{
                response.setHeader("WWW-Authenticate", `Digest realm="Secure Area",qop="auth",nonce="${nonce}",opaque="${opaque}"`);
                response.end("<!DOCTYPE html><html><body>Authorization Required</body></html>");
                return;
            })

        }
    }

    public route(request:IncomingMessage, response : ServerResponse){

        if(this.options.authorization && this.options.authorization != "none") {
            if(!request.headers["authorization"]) {
                return this.failAuth(request, response);
            } else {
                if(!this.options.users) {
                    endpointLogger.error("No Users"); //TODO better error
                    response.end("No Users");
                    return;
                }
                let header = request.headers["authorization"];
                let method = header.split(" ")[0];
                console.log(header);
                if(this.options.authorization == "basic") {
                    if(method.toLowerCase().trim() != "basic") return this.failAuth(request, response);
                    let base = header[1];
                    let debased = new Buffer(base, "base64").toString().split(":");
                    let username = debased[0];
                    let password = debased[1];
                    if(!this.options.users[username]) return this.failAuth(request, response);
                    if(this.options.users[username].password != password) return this.failAuth(request, response);
                    request.username = username;
                } else if(this.options.authorization == "digest") {
                    if(method.toLowerCase().trim() != "digest") return this.failAuth(request, response);
                    let r_result = digestRegex.exec(header);
                    let data = {};
                    while(r_result) {
                        data[r_result[1]] = r_result[2];
                        header = header.replace(r_result[0], "");
                        r_result = digestRegex.exec(header);
                    }
                    data["nonceCount"] = cnonceRegex.exec(header)[1];
                    if(!this.options.users[data["username"]]) return this.failAuth(request, response);
                    let ha1 = md5(`${data["username"]}:${"Secure Area"}:${this.options.users[data["username"]].password}`);
                    let ha2 = md5(`${request.method}:${request.url}`);
                    let hash = md5(`${ha1}:${data["nonce"]}:${data["nonceCount"]}:${data["cnonce"]}:${"auth"}:${ha2}`);
                    if(hash != data["response"]) {
                        return this.failAuth(request, response);
                    }
                } else {
                    return this.failAuth(request, response);;
                }
                request.headers.authorization = null;
                request.headers["authorization"] = null;
                request.rawHeaders.splice(request.rawHeaders.indexOf("Authorization"), 2);
                console.log(request.rawHeaders);
            }
        }
        if(!this.hasAliveHosts()) {
            return this.endpointContainer.locateEndpointForHost("default").route(request, response);
        }
        if(this.options.routingStrategy == "roundRobin") {
            this.roundRobinRoute(request, response);
        }
    }

    public routeSocket(request, socket, head) {
        if(!this.hasAliveHosts()) {
            socket.close();
        }

        if(this.options.routingStrategy == "roundRobin") {
            this.roundRobinSocketRoute(request, socket, head);
        }
    }

    private roundRobinRoute(request, response) {
        while(!this.proxies[this.roundRobinIndex].alive) {
            this.roundRobinIndex++;
            if(this.roundRobinIndex >= this.proxies.length) {
                this.roundRobinIndex = 0;
            }
        }
        this.proxies[this.roundRobinIndex].web(request, response);
        this.roundRobinIndex++;
        if(this.roundRobinIndex >= this.proxies.length) {
            this.roundRobinIndex = 0;
        }
    }

    private roundRobinSocketRoute(request, socket, head) {
        while(!this.proxies[this.roundRobinSocketIndex].alive) {
            this.roundRobinSocketIndex++;
            if(this.roundRobinSocketIndex >= this.proxies.length) {
                this.roundRobinSocketIndex = 0;
            }
        }
        this.proxies[this.roundRobinSocketIndex].ws(request, socket, head);
        this.roundRobinSocketIndex++;
        if(this.roundRobinSocketIndex >= this.proxies.length) {
            this.roundRobinSocketIndex = 0;
        }
    }

    public hasAliveHosts(): boolean {
        for(var node of this.proxies) {
            if(node.alive) return true;
        }
        return false;
    }

    public restart() {
        this.proxies = [];
        for(var target of this.options.targets) {
            this.proxies.push(new ProxyNode(target, this.options.allowSelfSigned, this));
        }
    }

    public toJSON() {
        return {
            host: this.host,
            options: this.options
        }
    }

    public retry(request, response) {
        this.route(request, response);
    }
    public retrySocket(request, socket, head) {

    }
}


class ProxyNode {
    public target: string;
    public proxy: httpProxy;
    public alive: boolean;
    public endpoint: Endpoint;
    public allowSelfSigned: boolean;
    private logTarget: string;
    public constructor(target: string, allowSelfSigned: boolean, endpoint: Endpoint) {
        this.target = target;
        this.allowSelfSigned = allowSelfSigned;
        this.alive = true;
        this.endpoint = endpoint;
        this.proxy = httpProxy.createProxyServer({
            target: this.target,
            secure: !this.allowSelfSigned
        });
        this.logTarget = this.target.replace("http://", "").replace("https://", "");
        this.proxy.on("proxyRes", (proxyRes, request : IncomingMessage, response : ServerResponse) =>{
            endpointLogger.info(`${this.endpoint.host} ${request.connection.remoteAddress} ${this.logTarget} ${(request as any).username || "-"} ${new Date().toISOString()} "${request.method +" "+request.url + " HTTP/"+request.httpVersion}" ${proxyRes.statusCode} - ${request.headers.referer ? "\""+request.headers.referer+"\"" : "-"} ${request.headers["user-agent"] ? "\""+request.headers["user-agent"]+"\"" : "-"}` )
        })
    }

    public web(request, response) {
        this.proxy.web(request, response, {}, (e)=>{
            if(e) {
                console.log(e);
                this.alive = false;
                this.endpoint.retry(request, response);
            }
        });
    }
    public ws(request, socket, head) {
        this.proxy.ws(request, socket, head);
    }
}


function printRequest(request: IncomingMessage) {
    return `${request.connection.remoteAddress || "-"} ${request.url || "-"}`;
}