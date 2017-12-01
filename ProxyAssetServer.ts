import * as express from "express";
import * as FileController from "./FileController";
var app = express();

var ejs_noRoute = FileController.compileEJS("proxy-assets/ejs/noRoute.ejs");


app.get("*", (req, res)=>{
    res.send(ejs_noRoute({host: req.host}));
})


app.listen(5001);