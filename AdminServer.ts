import * as express from "express";
import * as bodyParser from "body-parser";
import * as FileController from "./FileController";
import {EndpointManager} from "./EndpointManager";
import {CertificateStorage} from "./CertificateStorage";
import * as socketio from "socket.io";
import * as Stats from "./StatsCollector";

export function bind(endpoints: EndpointManager, certificates: CertificateStorage) {
    let app = express();
    var server = require('http').createServer(app);
    server.listen(5080);
    var io = socketio(server);

    let dispatcher = new UpdateDispatcher();
    Stats.setFinished((data)=>{
        dispatcher.digestStorageMap(data);
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use("/www", express.static("admin-assets/www"));

    var home_ejs = FileController.compileEJS("admin-assets/ejs/home.ejs");

    app.get("/", (req, res) => {
        res.send(home_ejs({}));
    });

    app.get("/api/endpoints", (req, res)=>{
        res.json(endpoints.getEndpointsWithStatus());
    });

    app.get("/api/endpoint/:id", (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        res.json(endpoint.options || {error: "not found"});
    });
    app.put("/api/endpoint/:id", (req, res)=>{
        endpoints.createEndpoint(req.params.id);
        res.json({success: true});
    })

    app.patch("/api/endpoint/:id", (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        endpoint.updateOptions(req.body, (result)=>{
            if(!result.success) {
                res.statusCode = 501;
                return res.json({errors: result.error});
            }
            res.json({success: true});
        });

    });

    app.post("/api/endpoint/:id/targets/delete", (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        for(let d of req.body) {
            endpoint.removeTarget(d);
        }
        res.json({success: true});
    });

    app.patch("/api/endpoint/:id/targets", (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        for(let d of req.body) {
            endpoint.addTarget(d);
        }
        res.json({success: true});
    })

    app.get("/api/certs", (req, res)=>{
        res.json(certificates.getCertList());
    });


    app.get("*", (req, res) => {
        res.send(home_ejs({}));
    });



    io.on("connection", function(socket) {
        dispatcher.registerSocket(socket);
    })
}


class UpdateDispatcher {
    clients: Array<UpdateClient> = [];

    public registerSocket(socket: SocketIO.Socket) {
        this.clients.push(new UpdateClient(socket, this));
    }

    public digestStorageMap(map: Stats.StorageBroadcast) {
        for(let c of this.clients) {
            c.sendStats(map);
        }
    }

}

class UpdateClient {
    socket: SocketIO.Socket;
    dispatcher: UpdateDispatcher;
    constructor(socket: SocketIO.Socket, dispatcher: UpdateDispatcher) {
        this.socket = socket;
        this.dispatcher = dispatcher;
    }
    public sendStats(map: Stats.StorageBroadcast) {
        this.socket.emit("stats", map);
    }
    public sendLog(s: string) {
        this.socket.emit("log", s);
    }
}