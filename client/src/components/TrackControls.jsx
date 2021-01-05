const React = require('react');

const TrackControls = props => {
    const disabled = props.error !== undefined || props.filename === undefined;

    let playOrPause;
    if (props.action === 'play') {
        playOrPause = (
            <button
                className="btn btn-secondary btn-sm"
                disabled={disabled}
                onClick={props.onPause}
            >
                Pause
            </button>
        );
    } else {
        playOrPause = (
            <button
                className="btn btn-secondary btn-sm"
                disabled={disabled}
                onClick={props.onPlay}
            >
                Play
            </button>
        );
    }

    return (
        <div>
            {playOrPause}
            <button
                className="btn btn-secondary btn-sm"
                disabled={disabled}
                onClick={props.onStop}
                style={{marginLeft: '0.25em'}}
            >
                Stop
            </button>
        </div>
    );
};

export default TrackControls;
