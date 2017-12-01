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
var Endpoint_1 = require("./Endpoint");
var axios_1 = require("axios");
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
        return (<div role={"tablist"} id={"endpointAccordion"}>
                {this.state.Endpoints.map(function (item, index) {
            return (<Endpoint_1.default Host={item.host} Target={item.options.target}/>);
        })}
            </div>);
    };
    EndpointContainer.prototype.componentDidMount = function () {
        var _this = this;
        axios_1.default.get("/api/endpoints").then(function (res) {
            _this.setState({ Endpoints: res.data });
        });
    };
    return EndpointContainer;
}(React.Component));
exports.default = EndpointContainer;
