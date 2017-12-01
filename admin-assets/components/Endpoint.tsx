import * as React from 'react';

export interface EndpointData {
    Host: string,
    Target: string
}
export default class Endpoint extends React.Component<EndpointData, {}> {
    render() {
        return(
            <div className="card" id={`endpoint-${this.props.Host.replace(/\./g, "_")}`}>
                <div className="card-header" role={"tab"} id={`endpoint-${this.props.Host.replace(/\./g, "_")}-header`}>
                    <h5 className={"mb-0"}>
                        <a data-toggle={"collapse"} href={`#endpoint-${this.props.Host.replace(/\./g, "_")}-body`} aria-expanded={false} aria-controls={`endpoint-${this.props.Host.replace(/\./g, "_")}-header`}>
                            {this.props.Host}
                        </a>
                    </h5>
                </div>
                <div className={"collapse"} role={"tabpanel"} aria-labelledby={`endpoint-${this.props.Host.replace(/\./g, "_")}-header`} data-parent={"#endpointAccordion"} id={`endpoint-${this.props.Host.replace(/\./g, "_")}-body`}>
                    <div className={"card-body"}>
                        <div className={"form-group row"}>
                            <div className={"col-sm-4"}>
                                <label className={"col-form-label"}><h4>Target</h4></label>
                                <p>The endpoint where your server is located.</p>
                            </div>
                            <div className={"col-sm-8"}>
                                <input type={"text"} value={this.props.Target} className={"form-control"}/>
                            </div>
                        </div>
                        <div className={"form-group row"}>
                            <div className={"col-sm-4"}>
                                <label className={"col-form-label"}><h4>SSL/TLS Settings</h4></label>
                                <p>The level of SSL Security enabled.</p>
                            </div>
                            <div className={"col-sm-8"}>
                                <select className={"form-control"}>
                                    <option>HTTP Only</option>
                                    <option>HTTP/HTTPS</option>
                                    <option>HTTPS Only</option>
                                </select>
                            </div>
                        </div>
                        <div className={"form-group row"}>
                            <div className={"col-sm-4"}>
                                <label className={"col-form-label"}><h4>Proxy Certificate</h4></label>
                                <p>The SSL Certificate to use.</p>
                            </div>
                            <div className={"col-sm-8"}>
                                <select className={"form-control"}>
                                    <option>Self-Signed Certificate</option>
                                    <option>Request Let's Encrypt Certificate</option>
                                </select>
                            </div>
                        </div>
                        <div className={"form-group row"}>
                            <div className={"col-sm-4"}>
                                <label className={"col-form-label"}><h4>Target Certificate</h4></label>
                                <p>If the target is over https, you can choose to force a valid certificate or accept a self-signed.</p>
                            </div>
                            <div className={"col-sm-8"}>
                                <select className={"form-control"}>
                                    <option>Require Valid Certificate</option>
                                    <option>Allow Self Signed</option>
                                </select>
                            </div>
                        </div>
                        <div className={"form-group row"}>
                            <div className={"col-sm-4"}>
                                <label className={"col-form-label"}><h4>Websocket Support</h4></label>
                                <p>Allow HTTP Upgrade Requests.</p>
                            </div>
                            <div className={"col-sm-8"}>
                                <select className={"form-control"}>
                                    <option>Enable WebSockets</option>
                                    <option>Disable WebSockets</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        )
    }
}