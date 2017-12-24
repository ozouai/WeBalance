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
var DefaultLayout_1 = require("./DefaultLayout");
var axios_1 = require("axios");
var react_router_dom_1 = require("react-router-dom");
var PluginAdmin = (function (_super) {
    __extends(PluginAdmin, _super);
    function PluginAdmin(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            loaded: false,
            plugins: []
        };
        return _this;
    }
    PluginAdmin.prototype.componentDidMount = function () {
        var _this = this;
        axios_1.default.get("/api/plugins", { headers: { "Authorization": "bearer " + window.token } }).then(function (res) {
            if (!res.data.error) {
                _this.setState({
                    loaded: true,
                    plugins: res.data
                });
            }
        });
    };
    PluginAdmin.prototype.render = function () {
        if (!this.state.loaded)
            return (<div>Loading</div>);
        return (<DefaultLayout_1.default>
                <h3>Active Plugins</h3>
                <ul>
                    {this.state.plugins.map(function (e, i) {
            return (<li><react_router_dom_1.Link to={"/plugins/" + e.id + "/"}>{e.name}</react_router_dom_1.Link></li>);
        })}
                </ul>
            </DefaultLayout_1.default>);
    };
    return PluginAdmin;
}(React.Component));
exports.default = PluginAdmin;
