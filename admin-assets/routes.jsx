"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var react_router_1 = require("react-router");
var EndpointContainer_1 = require("./components/EndpointContainer");
var routes = (<react_router_1.Route path={"/"} component={EndpointContainer_1.default}/>);
exports.default = routes;
