import React from 'react';
import ReactDOM from 'react-dom';
import AppRoutes from './components/AppRoutes';
import * as cgm from "./changeManager";

window.onload = () => {
    ReactDOM.render(<AppRoutes/>, document.getElementById('main'));
};