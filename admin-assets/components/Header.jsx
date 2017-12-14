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
var Modal = require("react-bootstrap-modal");
var Header = (function (_super) {
    __extends(Header, _super);
    function Header(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            changes: [],
            modalOpen: false
        };
        window.setHeaderState = _this.setState.bind(_this);
        _this.closeModal = _this.closeModal.bind(_this);
        _this.openModal = _this.openModal.bind(_this);
        return _this;
    }
    Header.prototype.closeModal = function () {
        this.setState({ modalOpen: false });
    };
    ;
    Header.prototype.openModal = function () {
        this.setState({ modalOpen: true });
    };
    ;
    Header.prototype.render = function () {
        var _this = this;
        return (<nav className="navbar navbar-expand-lg navbar-light bg-light">
                <react_router_dom_1.Link className="navbar-brand" to={"/"}>OuiProxy</react_router_dom_1.Link>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">

                    <ul className="navbar-nav mr-auto">
                        
                    </ul>

                    <div className="form-inline my-2 my-lg-0">
                        <button className="btn btn-outline-warning my-2 my-sm-0" onClick={this.openModal}>{this.state.changes.length == 0 ? "No Changes" : "Commit Changes"}</button>
                    </div>
                </div>
                <Modal show={this.state.modalOpen} onHide={this.closeModal} aria-labelledby={"CommitChangesHeader"}>
                    <Modal.Header>
                        <Modal.Title id={"CommitChangesHeader"}>Changes to Commit</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.state.changes.map(function (c, i) {
            return (<div className={"input-group"}>
                                    <input type={"text"} disabled={true} value={c.text} className={"form-control"}/>
                                    <span className={"input-group-btn"}>
                                        <button className={"btn btn-danger"} onClick={c.undo}>X</button>
                                    </span>
                                </div>);
        })}
                    </Modal.Body>
                    <Modal.Footer>
                    <Modal.Dismiss className='btn btn-default'>Cancel</Modal.Dismiss>


                    <button className='btn btn-primary' onClick={function () { window.changeManager.applyChanges(function (e) { window.reloadEndpointView(); _this.setState({ modalOpen: false }); }); }}>
                        Save
                    </button>
                    </Modal.Footer>
                </Modal>

            </nav>);
    };
    return Header;
}(React.Component));
exports.default = Header;
