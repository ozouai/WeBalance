import * as express from "express";
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as FileController from "./FileController";
import {EndpointManager} from "./EndpointManager";
import {CertificateStorage} from "./CertificateStorage";
import * as socketio from "socket.io";
import * as Stats from "./StatsCollector";
import * as safeSave from "./SafeSave";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import * as securePin from "secure-pin";
import {getAdminBlocks, getPluginList, getPluginAdminList, getPluginByName} from "./PluginManager"
let tokenStore : {
    [key: string]: {
        lastUsed: Date,
        user: string
    }
} = {};

if(!fs.existsSync(path.normalize(process.env.CONFIG_DIR+"/adminUsers.json"))) {
    safeSave.saveSync(path.normalize(process.env.CONFIG_DIR+"/adminUsers.json"), JSON.stringify({root: {password: ""}}));
}

let users = JSON.parse(fs.readFileSync(path.normalize(process.env.CONFIG_DIR+"/adminUsers.json"), "UTF-8"));

function requireAuth(request: express.Request, response: express.Response, next: express.NextFunction) {
    let token: string;
    if(request.params.token)
        token = request.params.token;
    else if(request.headers.authorization) {
        let header : string = request.headers.authorization
        if(header.indexOf("bearer") !== -1) {
            let d = header.split(" ");
            if(d[1]) {
                if(tokenStore[d[1]])
                    return next();
            }
        }
    }
    response.json({error: true});
}

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

    app.get("/api/tokenTest", requireAuth, (req, res)=>{
        res.json({success:true});
    })

    app.post("/api/signin", (req, res)=>{
        function fail() {
            res.json({error: "notfound"});
        }
        function auth() {
            let user = req.body.username;
            securePin.generateString(25, securePin.defaultCharset, (token)=>{
                tokenStore[token] = {
                    user: user,
                    lastUsed: new Date()
                }
                res.json({token: token})
            })

        }
        if(!req.body.username)
            return fail();
        if(!users[req.body.username])
            return fail();
        if(users[req.body.username].password == "*")
            return auth();
        bcrypt.compare(req.body.password, users[req.body.username].password, function(err, res){
            if(!res)
                return fail();
            if(res)
                return auth();
        })
    })

    app.get("/", (req, res) => {
        res.send(home_ejs({}));
    });

    app.get("/api/endpoints", requireAuth, (req, res)=>{
        res.json(endpoints.getEndpointsWithStatus());
    });

    app.get("/api/endpoint/:id", requireAuth, (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        res.json(endpoint.options || {error: "not found"});
    });
    app.put("/api/endpoint/:id", requireAuth, (req, res)=>{
        endpoints.createEndpoint(req.params.id);
        res.json({success: true});
    });

    app.get("/api/plugins", (req, res)=>{
        res.json(getPluginAdminList());
    });

    app.get("/api/plugins/:id/webInterface", (req, res)=>{
        let wi = getPluginByName(req.params.id).webInterface;
        res.json({name: wi.name, blocks: wi.blocks, values: wi.getValues()});
    });

    app.put("/api/plugins/:id/settings", (req, res)=>{
        let p = getPluginByName(req.params.id)
        p.webInterface.setValues(req.body);
        res.json({success: true});
    })

    app.get("/api/plugins/blocks", (req, res)=>{
        let blocks = getAdminBlocks();
        res.json(blocks);
    })

    app.patch("/api/endpoint/:id", requireAuth, (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        endpoint.updateOptions(req.body, (result)=>{
            if(!result.success) {
                res.statusCode = 501;
                return res.json({errors: result.error});
            }
            res.json({success: true});
        });

    });

    app.post("/api/endpoint/:id/targets/delete", requireAuth, (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        for(let d of req.body) {
            endpoint.removeTarget(d);
        }
        res.json({success: true});
    });

    app.patch("/api/endpoint/:id/targets", requireAuth, (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        for(let d of req.body) {
            endpoint.addTarget(d);
        }
        res.json({success: true});
    })

    app.get("/api/certs", requireAuth, (req, res)=>{
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