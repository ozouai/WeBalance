import * as React from "react";
import Header from "./Header";
export default class DefaultLayout extends React.Component<{}, {}> {
    render() {
        return (
            <div>
            <Header/>
        {
            this.props.children
        }
            </div>
        )
    }
}