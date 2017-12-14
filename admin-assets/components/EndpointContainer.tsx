import * as React from 'react';
import Endpoint from "./Endpoint";
import {Link, Redirect} from "react-router-dom";
import axios from 'axios';
import DefaultLayout from "./DefaultLayout";
export interface EndpointContainerState {
    Endpoints: Array<SharedInterfaces.EndpointsWithStatus>
}
export default class EndpointContainer extends React.Component<{}, EndpointContainerState> {
    constructor(props) {
        super(props);
        this.state = {
            Endpoints: []
        }
    }
    render() {
        if(!window.token.hasToken()) return (<Redirect to={"/signin"}/>);
        return(
            <DefaultLayout>
                <div className={"row"}>
                    <div className={"col-sm-12"}>
                        <Link to={"/newEndpoint"} className={"btn btn-primary"}>Create New Endpoint</Link>
                    </div>
                </div>
            <div role={"tablist"} id={"endpointAccordion"}>
                {this.state.Endpoints.map((item, index)=>{
                    let warning =item.targetsAlive != item.targets;
                    let error = item.targetsAlive == 0;
                    let mainClasses = "row endpointHomeView";
                    let icon = "check"
                    if(warning && !error) {
                        mainClasses+=" warning"
                        icon = "exclamation"
                    } else if(error) {
                        mainClasses+=" error"
                        icon = "ban";
                    }
                    return(

                        <div className={mainClasses}>
                            <div className={"col-sm-2 text-center badgeCol"}>
                                <span className={"fa-layers"}>
                                    <i className={"fas fa-shield-alt"} data-fa-transform="grow-3"></i>
                                    <i className={"fas fa-"+icon}  data-fa-transform="shrink-6"></i>
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
                                    <Link to={`/endpoint/${item.endpoint}`} className={"btn btn-warning"}>
                                        Edit
                                    </Link>
                                    <Link to={`/stats/${item.endpoint}`} className={"btn btn-primary"}>
                                        View Stats
                                    </Link>

                                </span>
                            </div>
                            <br/>
                        </div>

                    )
                })}
            </div>
            </DefaultLayout>
        )
    }
    componentDidMount() {
        axios.get("/api/endpoints", {headers:{"Authorization": "bearer "+ window.token}}).then((res)=>{
            if(!res.data.error) {
                this.setState({Endpoints: res.data})
            } else {
                window.token.invalidate();
            }
        })
        setInterval(()=>{
            axios.get("/api/endpoints", {headers:{"Authorization": "bearer "+ window.token}}).then((res)=>{
                if(!res.data.error) {
                    this.setState({Endpoints: res.data})
                }else {
                    window.token.invalidate();
                }
            })
        }, 30*1000);
    }
}