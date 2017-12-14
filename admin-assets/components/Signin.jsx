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
var Signin = (function (_super) {
    __extends(Signin, _super);
    function Signin(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            username: "",
            password: "",
            processing: false,
            error: false
        };
        _this.onSubmit = _this.onSubmit.bind(_this);
        return _this;
    }
    Signin.prototype.onSubmit = function (event) {
        var _this = this;
        event.preventDefault();
        this.setState({ processing: true });
        axios_1.default.post("/api/signin", { username: this.state.username, password: this.state.password }).then(function (res) {
            if (res.data.token) {
                window.token.setToken(res.data.token);
                if (_this.props.history) {
                    _this.props.history.push("/");
                    window.location.reload();
                }
            }
            if (res.data.error) {
                _this.setState({
                    error: true,
                    processing: false,
                    password: ""
                });
            }
        });
    };
    Signin.prototype.render = function () {
        var _this = this;
        return (<DefaultLayout_1.default>
                <form onSubmit={this.onSubmit}>
                <div className={"loginForm"}>
                    {(function () {
            if (_this.state.error) {
                return (<h4>Please try again</h4>);
            }
        })()}
                    <div className={"form-group"}>
                        <label>
                            Username
                        </label>
                        <input type={"text"} name={"username"} className={"form-control"} value={this.state.username} onChange={function (e) { _this.setState({ username: e.target.value }); }} disabled={this.state.processing}/>
                    </div>
                    <div className={"form-group"}>
                        <label>
                            Password
                        </label>
                        <input type={"password"} name={"password"} className={"form-control"} value={this.state.password} onChange={function (e) { _this.setState({ password: e.target.value }); }} disabled={this.state.processing}/>
                    </div>
                    <input type={"submit"} value={"Signin"} className={"btn btn-primary"} disabled={this.state.processing}/>
                </div>
                </form>
            </DefaultLayout_1.default>);
    };
    return Signin;
}(React.Component));
exports.default = Signin;
exports.SigninWithRouter = react_router_dom_1.withRouter(Signin);
