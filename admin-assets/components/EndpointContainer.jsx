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
var axios_1 = require("axios");
var DefaultLayout_1 = require("./DefaultLayout");
var EndpointContainer = (function (_super) {
    __extends(EndpointContainer, _super);
    function EndpointContainer(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            Endpoints: []
        };
        return _this;
    }
    EndpointContainer.prototype.render = function () {
        return (<DefaultLayout_1.default>
                <div className={"row"}>
                    <div className={"col-sm-12"}>
                        <react_router_dom_1.Link to={"/newEndpoint"} className={"btn btn-primary"}>Create New Endpoint</react_router_dom_1.Link>
                    </div>
                </div>
            <div role={"tablist"} id={"endpointAccordion"}>
                {this.state.Endpoints.map(function (item, index) {
            var warning = item.targetsAlive != item.targets;
            var error = item.targetsAlive == 0;
            var mainClasses = "row endpointHomeView";
            var icon = "check";
            if (warning && !error) {
                mainClasses += " warning";
                icon = "exclamation";
            }
            else if (error) {
                mainClasses += " error";
                icon = "ban";
            }
            return (<div className={mainClasses}>
                            <div className={"col-sm-2 text-center badgeCol"}>
                                <span className={"fa-layers"}>
                                    <i className={"fas fa-shield-alt"} data-fa-transform="grow-3"></i>
                                    <i className={"fas fa-" + icon} data-fa-transform="shrink-6"></i>
                                </span>

                            </div>
                            <div className={"col-sm-5"}>
                                <b className={"name"}>{item.friendlyName}</b> <small className={"text-muted"}>- {item.endpoint}</small>
                            </div>
                            <div className={"col-sm-2 text-center"}>
                                {item.targetsAlive} / {item.targets} <small>Targets Online</small>
                            </div>
                            <div className={"col-sm-3 text-right"}>
                                <span className={"btn-group"}>
                                    <react_router_dom_1.Link to={"/endpoint/" + item.endpoint} className={"btn btn-warning"}>
                                        Edit
                                    </react_router_dom_1.Link>
                                    <react_router_dom_1.Link to={"/stats/" + item.endpoint} className={"btn btn-primary"}>
                                        View Stats
                                    </react_router_dom_1.Link>

                                </span>
                            </div>
                            <br />
                        </div>);
        })}
            </div>
            </DefaultLayout_1.default>);
    };
    EndpointContainer.prototype.componentDidMount = function () {
        var _this = this;
        axios_1.default.get("/api/endpoints").then(function (res) {
            _this.setState({ Endpoints: res.data });
        });
        setInterval(function () {
            axios_1.default.get("/api/endpoints").then(function (res) {
                _this.setState({ Endpoints: res.data });
            });
        }, 30 * 1000);
    };
    return EndpointContainer;
}(React.Component));
exports.default = EndpointContainer;
