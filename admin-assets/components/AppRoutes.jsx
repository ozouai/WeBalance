"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var react_router_1 = require("react-router");
var react_router_dom_1 = require("react-router-dom");
var EndpointContainer_1 = require("./EndpointContainer");
var EndpointView_1 = require("./EndpointView");
var NewEndpoint_1 = require("./NewEndpoint");
var Signin_1 = require("./Signin");
var AppRoutes = (function (_super) {
    __extends(AppRoutes, _super);
    function AppRoutes() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AppRoutes.prototype.render = function () {
        return (<div>
            <react_router_dom_1.BrowserRouter>
                <react_router_1.Switch>
                    <react_router_dom_1.Route path={"/newEndpoint"} component={NewEndpoint_1.default}/>
                    <react_router_dom_1.Route path={"/endpoint/:id"} component={EndpointView_1.default}/>
                    <react_router_dom_1.Route path={"/signin"} component={Signin_1.default}/>
                    <react_router_dom_1.Route path={"/"} component={EndpointContainer_1.default}/>

                </react_router_1.Switch>
            </react_router_dom_1.BrowserRouter>
            </div>);
    };
    return AppRoutes;
}(React.Component));
exports.default = AppRoutes;
