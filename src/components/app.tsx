import * as React from 'react';
import { IRc } from '../config';

interface IProps {
    rc: IRc;
}

const Settings = (props: IProps) => <>
    <h3>SETTINGS@@@</h3>
    <p>{JSON.stringify(props.rc)}</p>
</>;

export default class App extends React.Component<IProps, any> {
    public canvas?: HTMLCanvasElement;

    setCanvas = (el: HTMLCanvasElement) => {
        this.canvas = el;
    }

    render() {
        return <>
            <canvas ref={this.setCanvas}/>
            <Settings rc={this.props.rc}/>
        </>;
    }
}
