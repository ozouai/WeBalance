import * as React from "react";
import axios from "axios";
import DefaultLayout from "./DefaultLayout";
import {WebInterface_BlockTypes, WebInterface} from "@webalance/ts-plugin-definitions";
export interface PluginView_State {
    loaded: boolean,
    webInterface?: WebInterface
}
export default class PluginView extends React.Component<{match:{params:{id: string}}}, PluginView_State> {
    constructor(props) {
        super(props);
        this.state = {loaded: false}
    }
    componentDidMount() {
        axios.get(`/api/plugins/${this.props.match.params.id}/webInterface`).then((res)=>{
            if(!res.data.error) {
                this.setState({loaded: true, webInterface: res.data});
            }
        })
    }
    render() {
        if(!this.state.loaded) return (<div>Loading</div>)
        return (
            <DefaultLayout>
                <h2>{this.state.webInterface.name}</h2>
                <hr/>
                {
                    this.state.webInterface.blocks.map((e, i)=>{
                        let input;
                        switch (e.type) {
                            case WebInterface_BlockTypes.TEXT:
                                input = (
                                    <input type={"text"} name={e.keyName} id={e.keyName} defaultValue={this.state.webInterface.values[e.keyName]} className={"form-control"}/>
                                )
                                break;
                            case WebInterface_BlockTypes.PASSWORD:
                                input = (
                                    <input type={"password"} name={e.keyName} id={e.keyName} defaultValue={this.state.webInterface.values[e.keyName]} className={"form-control"}/>
                                )
                                break;
                        }

                        return (
                            <div className={"row"}>
                                <div className={"col-sm-6"}>
                                    <h4>{e.name}</h4>
                                    <p>{e.helpText}</p>
                                </div>
                                <div className={"col-sm-6"}>
                                    {input}
                                </div>
                                <hr/>
                            </div>

                        )
                    })
                }
            </DefaultLayout>
        )
    }
}