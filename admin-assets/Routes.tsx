import * as React from 'react'
import { Route, Router } from 'react-router'
import EndpointPage from './components/EndpointContainer';


const routes = (
        <Route path={"/"} component={EndpointPage}/>
);

export default routes;