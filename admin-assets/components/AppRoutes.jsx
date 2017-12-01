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
var react_router_dom_1 = require("react-router-dom");
var routes_1 = require("../routes");
var AppRoutes = (function (_super) {
    __extends(AppRoutes, _super);
    function AppRoutes() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AppRoutes.prototype.render = function () {
        return (<react_router_dom_1.BrowserRouter>
                {routes_1.default}
            </react_router_dom_1.BrowserRouter>);
    };
    return AppRoutes;
}(React.Component));
exports.default = AppRoutes;
