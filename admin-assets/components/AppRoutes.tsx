import * as React from 'react';
import { Router, browserHistory } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom'
import routes from '../routes';

export default class AppRoutes extends React.Component {
    render() {
        return (
            <BrowserRouter>
                {routes}
            </BrowserRouter>
        );
    }
}