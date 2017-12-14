import * as React from 'react';
import { Router, browserHistory, Switch } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom'

import EndpointPage from './EndpointContainer';
import EndpointView from "./EndpointView";
import NewEndpointWithRouter from "./NewEndpoint";
import SigninWithRouter from "./Signin";
import Header from "./Header";
export default class AppRoutes extends React.Component {
    render() {
        return (
            <div>
            <BrowserRouter>
                <Switch>
                    <Route path={"/newEndpoint"} component={NewEndpointWithRouter} />
                    <Route path={"/endpoint/:id"} component={EndpointView} />
                    <Route path={"/signin"} component={SigninWithRouter}/>
                    <Route path={"/"} component={EndpointPage}/>

                </Switch>
            </BrowserRouter>
            </div>
        );
    }
}