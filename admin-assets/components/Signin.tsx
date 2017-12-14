import * as React from "react";
import DefaultLayout from "./DefaultLayout"
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

export default class Signin extends React.Component<{match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired}, {username: string, password: string, processing:boolean, error: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: "",
            processing: false,
            error: false
        }
        this.onSubmit = this.onSubmit.bind(this);
    }
    onSubmit(event) {
        event.preventDefault();
        this.setState({processing: true});
        axios.post("/api/signin", {username: this.state.username, password: this.state.password}).then((res)=>{
            if(res.data.token) {
                window.token.setToken(res.data.token);
                if(this.props.history) {
                    this.props.history.push("/");
                    window.location.reload();
                }
            }
            if(res.data.error) {
                this.setState({
                    error: true,
                    processing: false,
                    password: ""
                })
            }
        })
    }
    render() {
        return(
            <DefaultLayout>
                <form onSubmit={this.onSubmit}>
                <div className={"loginForm"}>
                    {(()=>{if(this.state.error) { return (
                        <h4>Please try again</h4>
                    )}})()}
                    <div className={"form-group"}>
                        <label>
                            Username
                        </label>
                        <input type={"text"} name={"username"}  className={"form-control"} value={this.state.username} onChange={(e)=>{this.setState({username: e.target.value})}} disabled={this.state.processing}/>
                    </div>
                    <div className={"form-group"}>
                        <label>
                            Password
                        </label>
                        <input type={"password"} name={"password"} className={"form-control"} value={this.state.password} onChange={(e)=>{this.setState({password: e.target.value})}} disabled={this.state.processing}/>
                    </div>
                    <input type={"submit"} value={"Signin"} className={"btn btn-primary"} disabled={this.state.processing}/>
                </div>
                </form>
            </DefaultLayout>
        )
    }
}


export const SigninWithRouter = withRouter(Signin);

