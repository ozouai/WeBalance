import * as React from 'react';

export default class EndpointView extends React.Component<{id: string}, {}> {
    render() {
        return(
            <div>
                {this.props.match.params.id}
            </div>
        )
    }

}