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
var react_bootstrap_switch_1 = require("react-bootstrap-switch");
var EndpointView = (function (_super) {
    __extends(EndpointView, _super);
    function EndpointView(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            loaded: false,
            certs: []
        };
        window.setEndpointState = _this.setState.bind(_this);
        _this.addTarget = _this.addTarget.bind(_this);
        window.reloadEndpointView = _this.reloadData.bind(_this);
        return _this;
    }
    EndpointView.prototype.addTarget = function () {
        if (this.targetInput.value.length > 0) {
            window.changeManager.tree.targets.push(this.targetInput.value);
            this.targetInput.value = "";
            window.changeManager.recalculate();
        }
    };
    EndpointView.prototype.render = function () {
        return (<DefaultLayout_1.default>
                {this.renderInternal()}
            </DefaultLayout_1.default>);
    };
    EndpointView.prototype.renderInternal = function () {
        var _this = this;
        if (!this.state.loaded) {
            return (<div>
                    Loading
                </div>);
        }
        return (<div>
                <h2>
                    <code>
                    {this.props.match.params.id}
                    </code>
                </h2>
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>Name</h3>
                        <p>A friendly name to help identify this endpoint</p>
                    </div>
                    <div className={"col-sm-6"}>
                        <input type={"text"} className={"form-control"} onChange={function (e) { window.changeManager.tree.friendlyName = e.target.value; window.changeManager.recalculate(); }} value={this.state.data.friendlyName}/>
                    </div>
                </div>
                <hr />
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>Targets</h3>
                        <p>The URLS to route the request to</p>
                    </div>
                    <div className={"col-sm-6"}>
                                {this.state.data.targets.map(function (item, index) {
            return (<div className={"input-group"}>
                                            <input type={"text"} className={"form-control"} disabled={true} value={item}/>
                                            <span className={"input-group-btn"}>
                                                <button className={"btn btn-danger"} type={"button"} onClick={function () { window.changeManager.tree.targets.splice(window.changeManager.tree.targets.indexOf(item), 1); window.changeManager.recalculate(); }}>-</button>
                                            </span>
                                        </div>);
        })}
                            <div className={"input-group"}>
                                <input type={"text"} className={"form-control"} placeholder={"Add Target"} aria-label={"Add Target"} ref={function (input) { _this.targetInput = input; }}/>
                                <span className={"input-group-btn"}>
                                    <button className={"btn btn-secondary"} type={"button"} onClick={this.addTarget}>+</button>
                                </span>
                            </div>
                    </div>
                </div>
                <hr />
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>Routing Strategy</h3>
                        <p>
                            How the load-balancer will choose what target to forward to
                        </p>
                    </div>
                    <div className={"col-sm-6"}>
                        <select className={"form-control"}>
                            <option value={"roundRobin"}>Round Robin</option>
                        </select>
                    </div>
                </div>
                <hr />
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>Allowed Protocols</h3>
                        <p>Various Supported protocols and their switches.</p>
                    </div>
                    <div className={"col-sm-6"}>
                        <div className={"row"}>
                            <div className={"col-sm-6"}>
                                HTTP
                            </div>
                            <div className={"col-sm-6"}>
                                <react_bootstrap_switch_1.default onChange={function (el, state) { window.changeManager.tree["http"] = state; window.changeManager.recalculate(); }} value={this.state.data.http}/>
                            </div>
                        </div>
                        <div className={"row"}>
                            <div className={"col-sm-6"}>
                                HTTPS
                            </div>
                            <div className={"col-sm-6"}>
                                <react_bootstrap_switch_1.default onChange={function (el, state) { window.changeManager.tree["https"] = state; window.changeManager.recalculate(); }} value={this.state.data.https}/>
                            </div>
                        </div>
                        <div className={"row"}>
                            <div className={"col-sm-6"}>
                                WS
                            </div>
                            <div className={"col-sm-6"}>
                                <react_bootstrap_switch_1.default onChange={function (el, state) { }}/>
                            </div>
                        </div>
                    </div>
                </div>
                <hr />
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>SSL</h3>
                        <p>SSL Certificate Configuration</p>
                    </div>
                    <div className={"col-sm-6"}>
                        <div className={"form-group"}>
                            <label>Certificate</label>
                            <select className={"form-control"} value={this.state.data.sslCert} onChange={function (e) { window.changeManager.tree["sslCert"] = e.target.value; window.changeManager.recalculate(); }}>
                                <option value={"default"}>None - Use Default</option>
                                <option value={"letsEncrypt"}>Request Let's Encrypt Certificate</option>
                                <optgroup label={"Installed Certs"}>
                                    {this.state.certs.map(function (e, i) {
            return (<option value={e.key}>{e.name}</option>);
        })}
                                </optgroup>
                            </select>
                        </div>
                        <div className={"row"}>
                            <div className={"col-sm-6"}>
                                <label>Allow Self Signed Certs</label>
                            </div>
                            <div className={"col-sm-6"}>
                                <react_bootstrap_switch_1.default onChange={function (el, state) { window.changeManager.tree["allowSelfSigned"] = state; window.changeManager.recalculate(); }} value={this.state.data.allowSelfSigned}/>
                            </div>
                        </div>
                    </div>
                </div>
                <hr />
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>Authentication</h3>
                        <p>Add Authentication</p>
                    </div>
                    <div className={"col-sm-6"}>
                        <div className={"form-group"}>
                            <label>Auth Type</label>
                            <select className={"form-control"}>
                                <option value={"none"}>None</option>
                                <option value={"basic"}>Auth Basic</option>
                                <option value={"digest"}>Auth Digest</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>);
    };
    EndpointView.prototype.reloadData = function () {
        var _this = this;
        axios_1.default.get("/api/endpoint/" + this.props.match.params.id).then(function (res) {
            _this.setState({ loaded: true, data: res.data });
            window.changeManager.setTree(_this.props.match.params.id, res.data);
            window.changeManager.recalculate();
        });
        axios_1.default.get("/api/certs").then(function (res) {
            _this.setState({ certs: res.data });
            for (var _i = 0, _a = res.data; _i < _a.length; _i++) {
                var c = _a[_i];
                window.changeManager.certLookup[c.key] = c.name;
            }
        });
    };
    EndpointView.prototype.componentDidMount = function () {
        this.reloadData();
    };
    return EndpointView;
}(React.Component));
exports.default = EndpointView;
