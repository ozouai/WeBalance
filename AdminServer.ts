import * as express from "express";
import * as bodyParser from "body-parser";
import * as FileController from "./FileController";
import {EndpointManager} from "./EndpointManager";
import {CertificateStorage} from "./CertificateStorage";

export function bind(endpoints: EndpointManager, certificates: CertificateStorage) {
    let app = express();

    app.listen(5080);
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

    app.patch("/api/endpoint/:id", (req, res)=>{
        let endpoint = endpoints.locateEndpointForHost(req.params.id);
        endpoint.updateOptions(req.body, (result)=>{
            if(!result.success) {
                res.statusCode = 501;
                return res.json({errors: result.error});
            }
            res.json({success: true});
        });

    })

    app.get("/api/certs", (req, res)=>{
        res.json(certificates.getCertList());
    })


    app.get("*", (req, res) => {
        res.send(home_ejs({}));
    });

}