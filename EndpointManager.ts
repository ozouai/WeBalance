import * as httpProxy from "http-proxy";
import * as path from "path";
import * as fs from "fs";
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
        return Object.values(this.endpoints);
    }

    public addEndpoint(host: string, options: EndpointOptions) {
        let endpoint = new Endpoint(host, this, options);
        this.endpoints[host] = endpoint;
        this.save();
    }

    public route(request, response) {
        let endpoint = this.locateEndpointForHost(request.headers.host);
        if(endpoint.options.http) {
            endpoint.route(request, response);
        } else {
            if(endpoint.options.https) {
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
        let endpoint = this.locateEndpointForHost(request.headers.host);
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
}
export interface EndpointOptions{
    targets: Array<string>;
    http: boolean;
    https: boolean;
    allowSelfSigned: boolean;
    enabled: boolean;
    routingStrategy: "roundRobin"
}

export class Endpoint {
    public host: string;
    public options: EndpointOptions;
    public endpointContainer: EndpointManager;
    private proxies: Array<ProxyNode> = [];
    private roundRobinIndex = 0;
    private roundRobinSocketIndex = 0;
    constructor(host: string, endpointContainer: EndpointManager, options: EndpointOptions) {
        this.host = host;
        this.options = options;
        this.endpointContainer = endpointContainer;
        this.restart();
    }

    public route(request, response){
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
    public constructor(target: string, allowSelfSigned: boolean, endpoint: Endpoint) {
        this.target = target;
        this.allowSelfSigned = allowSelfSigned;
        this.alive = true;
        this.endpoint = endpoint;
        this.proxy = httpProxy.createProxyServer({
            target: this.target,
            secure: !this.allowSelfSigned
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