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
var ts_plugin_definitions_1 = require("@webalance/ts-plugin-definitions");
var PluginView = (function (_super) {
    __extends(PluginView, _super);
    function PluginView(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { loaded: false };
        return _this;
    }
    PluginView.prototype.componentDidMount = function () {
        var _this = this;
        axios_1.default.get("/api/plugins/" + this.props.match.params.id + "/webInterface").then(function (res) {
            if (!res.data.error) {
                _this.setState({ loaded: true, webInterface: res.data });
            }
        });
    };
    PluginView.prototype.render = function () {
        var _this = this;
        if (!this.state.loaded)
            return (<div>Loading</div>);
        return (<DefaultLayout_1.default>
                <h2>{this.state.webInterface.name}</h2>
                <hr />
                {this.state.webInterface.blocks.map(function (e, i) {
            var input;
            switch (e.type) {
                case ts_plugin_definitions_1.WebInterface_BlockTypes.TEXT:
                    input = (<input type={"text"} name={e.keyName} id={e.keyName} defaultValue={_this.state.webInterface.values[e.keyName]} className={"form-control"}/>);
                    break;
                case ts_plugin_definitions_1.WebInterface_BlockTypes.PASSWORD:
                    input = (<input type={"password"} name={e.keyName} id={e.keyName} defaultValue={_this.state.webInterface.values[e.keyName]} className={"form-control"}/>);
                    break;
            }
            return (<div className={"row"}>
                                <div className={"col-sm-6"}>
                                    <h4>{e.name}</h4>
                                    <p>{e.helpText}</p>
                                </div>
                                <div className={"col-sm-6"}>
                                    {input}
                                </div>
                                <hr />
                            </div>);
        })}
            </DefaultLayout_1.default>);
    };
    return PluginView;
}(React.Component));
exports.default = PluginView;
