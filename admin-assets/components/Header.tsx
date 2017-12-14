import * as React from "react";
import {Link} from "react-router-dom";
import {HumanChangeResult} from "../changeManager";
import Modal = require("react-bootstrap-modal");
export default class Header extends React.Component<{}, {changes: Array<HumanChangeResult>, modalOpen: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            changes: [],
            modalOpen: false
        };
        (window as any).setHeaderState = this.setState.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.openModal = this.openModal.bind(this);
    }
    closeModal() {
        this.setState({modalOpen: false});
    };
    openModal() {
        this.setState({modalOpen: true});
    };
    render() {

        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <Link className="navbar-brand" to={"/"}>OuiProxy</Link>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">

                    <ul className="navbar-nav mr-auto">
                        {/*
                        <li className="nav-item active">
                            <a className="nav-link" href="#">Endpoints <span className="sr-only">(current)</span></a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#">Link</a>
                        </li>
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Dropdown
                            </a>
                            <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                                <a className="dropdown-item" href="#">Action</a>
                                <a className="dropdown-item" href="#">Another action</a>
                                <div className="dropdown-divider"></div>
                                <a className="dropdown-item" href="#">Something else here</a>
                            </div>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link disabled" href="#">Disabled</a>
                        </li>
                        */}
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
                        {this.state.changes.map(function(c, i){
                            return (
                                <div className={"input-group"}>
                                    <input type={"text"} disabled={true} value={c.text} className={"form-control"}/>
                                    <span className={"input-group-btn"}>
                                        <button className={"btn btn-danger"} onClick={c.undo}>X</button>
                                    </span>
                                </div>
                            )
                        })}
                    </Modal.Body>
                    <Modal.Footer>
                    <Modal.Dismiss className='btn btn-default'>Cancel</Modal.Dismiss>


                    <button className='btn btn-primary' onClick={()=>{window.changeManager.applyChanges((e)=>{window.reloadEndpointView();this.setState({modalOpen: false})})}}>
                        Save
                    </button>
                    </Modal.Footer>
                </Modal>

            </nav>
        )
    }
}