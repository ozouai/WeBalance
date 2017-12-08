import * as React from 'react';
import Endpoint from "./Endpoint";
import {Link} from "react-router-dom";
import axios from 'axios';
import DefaultLayout from "./DefaultLayout";
export interface EndpointContainerState {
    Endpoints: Array<{
        host: string,
        options: {
            target: string
        }
    }>


}
export default class EndpointContainer extends React.Component<{}, EndpointContainerState> {
    constructor(props) {
        super(props);
        this.state = {
            Endpoints: []
        }
    }
    render() {
        return(
            <DefaultLayout>
            <div role={"tablist"} id={"endpointAccordion"}>
                {this.state.Endpoints.map((item, index)=>{
                    return(<div><Link to={`/endpoint/${item.host}`}>{item.host}</Link><br/></div>)
                })}
            </div>
            </DefaultLayout>
        )
    }
    componentDidMount() {
        axios.get("/api/endpoints").then((res)=>{
            this.setState({Endpoints: res.data})
        })
    }
}