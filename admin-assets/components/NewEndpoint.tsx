import * as React from 'react';
import PropTypes from 'prop-types'
import axios from 'axios';
import DefaultLayout from "./DefaultLayout";
import { withRouter, Redirect } from 'react-router-dom'
export default class NewEndpoint extends React.Component<{match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired}, {}> {
    constructor(props) {
        super(props);
        this.createEndpoint = this.createEndpoint.bind(this);
    }
    fqdnInput: any;
    render() {
        if(!window.token.hasToken()) return (<Redirect to={"/signin"}/>);
        const { match, location, history } = this.props
        return (
            <DefaultLayout>
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
                            <input type={"text"} className={"form-control"} ref={(ref)=>{this.fqdnInput = ref;}}/>
                            <span className={"input-group-btn"}>
                                <button className={"btn btn-primary"} onClick={this.createEndpoint}>Create</button>
                            </span>
                        </div>
                    </div>
                </div>
            </DefaultLayout>
        )
    }
    createEndpoint() {
        let host = this.fqdnInput.value;
        if(host.length > 0) {
            axios.put(`/api/endpoint/${host}`, {}, {headers:{"Authorization": "bearer "+ window.token}}).then((res)=>{
                if(!res.data.error) {
                    this.props.history.push(`/endpoint/${host}`);
                } else {
                    window.token.invalidate();
                }
            })
        }
    }
}

export const NewEndpointWithRouter = withRouter(NewEndpoint)