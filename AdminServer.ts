import * as express from "express";
import * as FileController from "./FileController";
import {EndpointManager} from "./EndpointManager";
import {CertificateStorage} from "./CertificateStorage";

export function bind(endpoints: EndpointManager, certificates: CertificateStorage) {
    let app = express();

    app.listen(5080);

    app.use("/www", express.static("admin-assets/www"));

    var home_ejs = FileController.compileEJS("admin-assets/ejs/home.ejs");

    app.get("/", (req, res) => {
        res.send(home_ejs({}));
    });

    app.get("/api/endpoints", (req, res)=>{
        res.json(endpoints.getEndpoints());
    })


}