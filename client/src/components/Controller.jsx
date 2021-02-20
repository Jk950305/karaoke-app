const React = require('react');

class Controller extends React.Component {
    render() {
        return (

            <div className="container">
                <div className="row">
                    <div className="col-sm">
                        <button type="button" className="btn btns btn-secondary" disabled> &lt; </button>
                    </div>
                    <div className="col-sm tagg">
                        <a className="btn btn-secondary" href={this.props.file} download={this.props.filename+".mp4"}>download</a>
                    </div>
                    <div className="col-sm">
                        <button type="button" onClick={e => this.props.playNext(e)} className="btn btns btn-secondary" disabled={(this.props.queue.length<=0)}> &gt; </button>
                    </div>
                </div>

                <div className="row">
                    <div className="col-sm">
                        <button id="decreasePitch" type="button" onClick={e => this.props.handlePitch(e)} className="btn btns btn-secondary" disabled={(this.props.pitch_key===-12)}> - </button>
                    </div>
                    <div className="col-sm tagg">
                        <p> 
                            Pitch ({ (this.props.pitch_key<0)?(this.props.pitch_key):("+"+this.props.pitch_key) } key) 
                        </p>
                    </div>
                    <div className="col-sm">
                        <button id="increasePitch" type="button" onClick={e => this.props.handlePitch(e)} className="btn btns btn-secondary" disabled={(this.props.pitch_key===12)}> + </button>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm">
                        <button id="decreaseTempo" type="button" onClick={e => this.props.handleTempo(e)} className="btn btns btn-secondary" disabled={(this.props.tempo===0.5)}> - </button>
                    </div>
                    <div className="col-sm tagg">
                        <p> Tempo ({ parseFloat(this.props.tempo).toFixed(1) }x) </p>
                    </div>
                    <div className="col-sm">
                        <button id="increaseTempo" type="button" onClick={e => this.props.handleTempo(e)} className="btn btns btn-secondary" disabled={(this.props.tempo===2.0)}> + </button>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm">
                        <button id="decreaseLatency" type="button" onClick={e => this.props.handleLatency(e)} className="btn btns btn-secondary" disabled={(this.props.latency===0)}> - </button>
                    </div>
                    <div className="col-sm tagg">
                        <p>
                            Audio Latency ({ (this.props.latency<0)?(this.props.latency):("+"+this.props.latency) } sec) 
                        </p>
                    </div>
                    <div className="col-sm">
                        <button id="increaseLatency" type="button" onClick={e => this.props.handleLatency(e)} className="btn btns btn-secondary" disabled={(this.props.latency===2.0)}> + </button>
                    </div>
                </div>
            </div>
        );
    }
};


export default Controller;
