import * as React from "react";
import DefaultLayout from "./DefaultLayout";
import axios from 'axios';
import {Link} from "react-router-dom";
export interface PluginAdminState {
    loaded: boolean,
    plugins: Array<{
        id: string,
        name: string
    }>
}
export default class PluginAdmin extends React.Component<{}, PluginAdminState> {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            plugins: []
        }
    }
    componentDidMount() {
        axios.get("/api/plugins", {headers:{"Authorization": "bearer "+ window.token}}).then((res)=>{
            if(!res.data.error) {
                this.setState({
                    loaded: true,
                    plugins: res.data
                })
            }
        })
    }

    render() {
        if(!this.state.loaded) return (<div>Loading</div>);

        return (
            <DefaultLayout>
                <h3>Active Plugins</h3>
                <ul>
                    {
                        this.state.plugins.map((e, i)=>{
                            return (<li><Link to={`/plugins/${e.id}/`}>{e.name}</Link></li>)
                        })
                    }
                </ul>
            </DefaultLayout>
        )
    }

}