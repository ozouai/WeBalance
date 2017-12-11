import * as React from 'react';
import axios from 'axios';
import DefaultLayout from "./DefaultLayout";
import Switch from 'react-bootstrap-switch';
export interface EndpointViewState {
    host?: string;
    loaded?: boolean;
    data?: {
        targets: Array<string>,
        routingStrategy: string,
        http: boolean,
        https: boolean,
        allowSelfSigned: boolean,
        authorization: string,
        sslCert: string,
        users: {
            [key: string]: {
                username: string,
                password:string
            }
        },
        friendlyName: string,
        enabled: boolean
    },
    certs:Array<{name: string, key: string}>
}
export interface EndpointViewProps {
    match: {
        params: {
            id: string
        }
    }
}
export default class EndpointView extends React.Component<EndpointViewProps, EndpointViewState> {
    targetInput: any;
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            certs: []
        };
        (window as any).setEndpointState = this.setState.bind(this);
        this.addTarget = this.addTarget.bind(this);
        (window as any).reloadEndpointView = this.reloadData.bind(this);
    }
    addTarget() {
        if(this.targetInput.value.length > 0) {
            window.changeManager.tree.targets.push(this.targetInput.value);
            this.targetInput.value = "";
            window.changeManager.recalculate();
        }
    }
    render() {
        return (
            <DefaultLayout>
                {this.renderInternal()}
            </DefaultLayout>
        )
    }
    renderInternal() {
        if(!this.state.loaded) {
            return (
                <div>
                    Loading
                </div>
            )
        }
        return(
            <div>
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
                        <input type={"text"} className={"form-control"} onChange={(e)=>{window.changeManager.tree.friendlyName = e.target.value;window.changeManager.recalculate();}} value={this.state.data.friendlyName}/>
                    </div>
                </div>
                <hr/>
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>Targets</h3>
                        <p>The URLS to route the request to</p>
                    </div>
                    <div className={"col-sm-6"}>
                                {
                                    this.state.data.targets.map((item, index)=>{
                                        return (<div className={"input-group"}>
                                            <input type={"text"} className={"form-control"} disabled={true} value={item}/>
                                            <span className={"input-group-btn"}>
                                                <button className={"btn btn-danger"} type={"button"} onClick={()=>{window.changeManager.tree.targets.splice(window.changeManager.tree.targets.indexOf(item), 1); window.changeManager.recalculate();}}><i className="fas fa-minus"></i></button>
                                            </span>
                                        </div>);
                                    })
                                }
                            <div className={"input-group"}>
                                <input type={"text"} className={"form-control"} placeholder={"Add Target"} aria-label={"Add Target"} ref={(input)=>{this.targetInput = input;}}/>
                                <span className={"input-group-btn"}>
                                    <button className={"btn btn-secondary"} type={"button"} onClick={this.addTarget}><i className="fas fa-plus"></i></button>
                                </span>
                            </div>
                    </div>
                </div>
                <hr/>
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
                <hr/>
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
                                <Switch onChange={(el, state)=>{window.changeManager.tree["http"] = state; window.changeManager.recalculate();}} value={this.state.data.http}/>
                            </div>
                        </div>
                        <div className={"row"}>
                            <div className={"col-sm-6"}>
                                HTTPS
                            </div>
                            <div className={"col-sm-6"}>
                                <Switch onChange={(el, state)=>{window.changeManager.tree["https"] = state; window.changeManager.recalculate();}} value={this.state.data.https}/>
                            </div>
                        </div>
                        <div className={"row"}>
                            <div className={"col-sm-6"}>
                                WS
                            </div>
                            <div className={"col-sm-6"}>
                                <Switch onChange={(el, state)=>{}}/>
                            </div>
                        </div>
                    </div>
                </div>
                <hr/>
                <div className={"row"}>
                    <div className={"col-sm-6"}>
                        <h3>SSL</h3>
                        <p>SSL Certificate Configuration</p>
                    </div>
                    <div className={"col-sm-6"}>
                        <div className={"form-group"}>
                            <label>Certificate</label>
                            <select className={"form-control"} value={this.state.data.sslCert} onChange={(e)=>{window.changeManager.tree["sslCert"] = e.target.value; window.changeManager.recalculate();}}>
                                <option value={"default"}>None - Use Default</option>
                                <option value={"letsEncrypt"}>Request Let's Encrypt Certificate</option>
                                <optgroup label={"Installed Certs"}>
                                    {this.state.certs.map((e, i)=>{
                                        return (<option value={e.key}>{e.name}</option>)
                                    })}
                                </optgroup>
                            </select>
                        </div>
                        <div className={"row"}>
                            <div className={"col-sm-6"}>
                                <label>Allow Self Signed Certs</label>
                            </div>
                            <div className={"col-sm-6"}>
                                <Switch onChange={(el, state)=>{window.changeManager.tree["allowSelfSigned"] = state; window.changeManager.recalculate();}} value={this.state.data.allowSelfSigned}/>
                            </div>
                        </div>
                    </div>
                </div>
                <hr/>
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
            </div>
        )
    }
    reloadData() {
        axios.get(`/api/endpoint/${this.props.match.params.id}`).then((res)=>{
            this.setState({loaded: true, data: res.data});
            (window as any).changeManager.setTree(this.props.match.params.id, res.data);
            window.changeManager.recalculate();
        })
        axios.get("/api/certs").then((res)=>{
            this.setState({certs: res.data});
            for(let c of res.data) {
                window.changeManager.certLookup[c.key] = c.name;
            }
        });
    }
    componentDidMount() {
        this.reloadData();
    }

}