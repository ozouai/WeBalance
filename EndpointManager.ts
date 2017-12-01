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
                let ne = new Endpoint(e.host, e.options);
                this.endpoints[e.host] = ne;
            }
        }
        if(!this.endpoints["default"]) {
            this.addEndpoint("default", {
                target: "http://127.0.0.1:5001",
                http:true,
                https:true,
                allowSelfSigned: true,
                enabled: true
            });
        }
    }

    public getEndpoints(): Array<Endpoint> {
        return Object.values(this.endpoints);
    }

    public addEndpoint(host: string, options: EndpointOptions) {
        let endpoint = new Endpoint(host, options);
        this.endpoints[host] = endpoint;
        this.save();
    }

    public route(request, response) {
        let endpoint = this.locateEndpointForHost(request.headers.host);
        if(endpoint.options.http) {
            endpoint.proxy.web(request, response);
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
            endpoint.proxy.web(request, response);
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
        endpoint.proxy.ws(request, socket, head);
    }

    public socketSecure(request, socket, head) {
        let endpoint = this.locateEndpointForHost(request.headers.host);
        endpoint.proxy.ws(request, socket, head);
    }

    public save() {
        let e = [];
        for(var key of Object.keys(this.endpoints)) {
            let end = this.endpoints[key];
            e.push(end.toJSON());
        }
        fs.writeFileSync(path.normalize(`${process.env.CONFIG_DIR}/endpoints.json`), JSON.stringify(e));
    }

    private locateEndpointForHost(host: string) : Endpoint {
        if(this.endpoints[host]) return this.endpoints[host];
        return this.endpoints["default"];
    }
}
export interface EndpointOptions{
    target: string;
    http: boolean;
    https: boolean;
    allowSelfSigned: boolean;
    enabled: boolean;
}

export class Endpoint {
    public host: string;
    public options: EndpointOptions
    public proxy: httpProxy;
    constructor(host: string, options: EndpointOptions) {
        this.host = host;
        this.options = options;
        this.restart();
    }

    public restart() {
        this.proxy = httpProxy.createProxyServer({
            target: this.options.target,
            secure: !this.options.allowSelfSigned
        })
    }

    public toJSON() {
        return {
            host: this.host,
            options: this.options
        }
    }
}