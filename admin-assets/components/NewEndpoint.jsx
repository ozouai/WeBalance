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
var axios_1 = require("axios");
var DefaultLayout_1 = require("./DefaultLayout");
var react_router_dom_1 = require("react-router-dom");
var NewEndpoint = (function (_super) {
    __extends(NewEndpoint, _super);
    function NewEndpoint(props) {
        var _this = _super.call(this, props) || this;
        _this.createEndpoint = _this.createEndpoint.bind(_this);
        return _this;
    }
    NewEndpoint.prototype.render = function () {
        var _this = this;
        if (!window.token.hasToken())
            return (<react_router_dom_1.Redirect to={"/signin"}/>);
        var _a = this.props, match = _a.match, location = _a.location, history = _a.history;
        return (<DefaultLayout_1.default>
                <h1>New Endpoint</h1>
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>FQDN</h3>
                        <p>The fully qualified domain name of the endpoint</p>
                        <ul>
                            <li><small>thehost.local</small></li>
                            <li><small>example.com</small></li>
                            <li><small>secret.example.com</small></li>
                        </ul>
                    </div>
                    <div className={"col-sm-6"}>
                        <div className={"input-group"}>
                            <input type={"text"} className={"form-control"} ref={function (ref) { _this.fqdnInput = ref; }}/>
                            <span className={"input-group-btn"}>
                                <button className={"btn btn-primary"} onClick={this.createEndpoint}>Create</button>
                            </span>
                        </div>
                    </div>
                </div>
            </DefaultLayout_1.default>);
    };
    NewEndpoint.prototype.createEndpoint = function () {
        var _this = this;
        var host = this.fqdnInput.value;
        if (host.length > 0) {
            axios_1.default.put("/api/endpoint/" + host).then(function (res) {
                _this.props.history.push("/endpoint/" + host);
            });
        }
    };
    return NewEndpoint;
}(React.Component));
exports.default = NewEndpoint;
exports.NewEndpointWithRouter = react_router_dom_1.withRouter(NewEndpoint);
