import * as React from 'react';
import Endpoint from "./Endpoint";
import axios from 'axios';
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
            <div role={"tablist"} id={"endpointAccordion"}>
                {this.state.Endpoints.map((item, index)=>{
                    return(<Endpoint Host={item.host} Target={item.options.target}/>)
                })}
            </div>
        )
    }
    componentDidMount() {
        axios.get("/api/endpoints").then((res)=>{
            this.setState({Endpoints: res.data})
        })
    }
}