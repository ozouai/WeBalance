import * as React from 'react';
import { Router, browserHistory, Switch } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom'

import EndpointPage from './EndpointContainer';
import EndpointView from "./EndpointView";

export default class AppRoutes extends React.Component {
    render() {
        return (
            <BrowserRouter>
                <Switch>
                    <Route path={"/endpoint/:id"} component={EndpointView} />
                    <Route path={"/"} component={EndpointPage}/>
                </Switch>
            </BrowserRouter>
        );
    }
}