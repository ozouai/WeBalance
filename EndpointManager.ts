import * as httpProxy from "http-proxy";
export class EndpointManager {
    private endpoints: {
        [key: string]: Endpoint
    } = {};


    public addEndpoint(host: string, target: string, http: boolean, https: boolean, allowSelfSigned: boolean) {
        let endpoint = new Endpoint(host, target, http, https, allowSelfSigned);
        this.endpoints[host] = endpoint;
    }

    public route(request, response) {
        let endpoint = this.locateEndpointForHost(request.headers.host);
        if(endpoint.allowHTTP) {
            endpoint.proxy.web(request, response);
        } else {
            if(endpoint.allowHTTPS) {
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
        if(endpoint.allowHTTPS) {
            endpoint.proxy.web(request, response);
        } else {
            if(endpoint.allowHTTP) {
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

    private locateEndpointForHost(host: string) : Endpoint {
        return this.endpoints[host];
    }
}


export class Endpoint {
    public target: string;
    public host: string;
    public allowHTTP: boolean;
    public allowHTTPS: boolean;
    public allowSelfSigned: boolean;
    public proxy: httpProxy;
    constructor(host: string, target: string, allowHTTP: boolean, allowHTTPS: boolean, allowSelfSigned: boolean) {
        this.host = host;
        this.target = target;
        this.allowHTTP = allowHTTP;
        this.allowHTTPS = allowHTTPS;
        this.allowSelfSigned =allowSelfSigned;
        this.proxy = httpProxy.createProxyServer({
            target: this.target,
            secure: !this.allowSelfSigned
        })
    }
}