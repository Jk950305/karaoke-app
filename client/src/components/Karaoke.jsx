import FilenameLabel from'./FilenameLabel.jsx';
import TrackControls from'./TrackControls.jsx';
import ErrorAlert from'./ErrorAlert.jsx';

const EventEmitter = require('events').EventEmitter;
const React = require('react');
const AudioPlayer = require('./../lib/AudioPlayer');

class Karaoke extends React.Component {

	constructor(props) {
        super(props);

        this.state = {
            action: 'stop',
            duration: undefined,
            error: undefined,
            filename: undefined,
            pitch: 1.0,
            key: 0,
            simpleFilter: undefined,
            status: [],
            t: 0,
            tempo: 1.0,
        };

        this.emitter = new EventEmitter();
        this.emitter.on('state', state => this.setState(state));
        this.emitter.on('status', status => {
            if (status === 'Done!') {
                this.setState({status: []});
            } else {
                this.setState({status: this.state.status.concat(status)});
            }
        });
        this.emitter.on('stop', () => this.stop());

        this.audioPlayer = new AudioPlayer({
            emitter: this.emitter,
            pitch: this.state.pitch,
            tempo: this.state.tempo,
        });

        this.inputRef = React.createRef();
        this.file_location = "";
    }

    play() {
        if (this.state.action !== 'play') {
            this.audioPlayer.play();
            this.setState({action: 'play'});
        }
    }

    pause() {
        if (this.state.action === 'play') {
            this.audioPlayer.pause();
            this.setState({action: 'pause'});
        }
    }

    stop() {
        this.pause();
        this.audioPlayer.seekPercent(0);
        this.setState({action: 'stop', t: 0});
    }

    handleFileChange(e) {
        if (e.target.files.length > 0) {
            this.stop();

            this.emitter.emit('status', 'Reading file...');
            this.emitter.emit('state', {
                error: undefined,
                filename: undefined,
            });




            // http://stackoverflow.com/q/4851595/786644
            const filename = e.target.value.replace('C:\\fakepath\\', '');
            this.emitter.emit('state', {filename});

            const file = e.target.files[0];
            this.file_location = URL.createObjectURL(file);

            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async event => {
                this.emitter.emit('status', 'Playing file...');

                let buffer;
                try {
                    buffer = await this.audioPlayer.decodeAudioData(event.target.result);
                } catch (err) {
                    this.emitter.emit('state', {
                        error: {
                            message: err.message,
                            type: 'Decoding error',
                        },
                    });
                    return;
                }

                this.file_location = filename;

                this.audioPlayer.setBuffer(buffer);
                this.play();
            };
        }
    }

    //https://prgomez.com/why-do-re-mi/

    getPitchValue(val) {
    	var num = 0;
    	var s_var = (val>=0)?(parseInt(val)):(12+parseInt(val));
    	switch(s_var){
    		case 0 : 
    			num = 1;
    			break;
    		case 1 : 
    			num = 1.059;
    			break;
    		case 2 : 
    			num = 1.122;
    			break;
    		case 3 : 
    			num = 1.189;
    			break;
    		case 4 : 
    			num = 1.26;
    			break;
    		case 5 : 
    			num = 1.335;
    			break;
    		case 6 : 
    			num = 1.414;
    			break;
    		case 7 : 
    			num = 1.498;
    			break;
    		case 8 : 
    			num = 1.587;
    			break;
    		case 9 : 
    			num = 1.682;
    			break;
    		case 10 : 
    			num = 1.782;
    			break;
    		case 11 : 
    			num = 1.888;
    			break;
    		case 12 : 
    			num = 2;
    			break;
    		default : 
    			num = 1;
    			break;
    	}
        const pitch = (val>=0)?(num):(num/2);
        return pitch;
    }
    handlePitchChange(e) {
        const pitch = this.getPitchValue(e.target.value);
        this.audioPlayer.pitch = pitch;
        this.setState({pitch});
    }
    
    decreasePitch(e){
    	if(this.state.pitch > 0.5 && this.state.pitch <= 2){
    		const key = this.state.key-1;
    		const pitch = this.getPitchValue(key);

	        this.audioPlayer.pitch = pitch;
	        this.setState({key});
	        this.setState({pitch});
    	}
    }

    increasePitch(e){
    	if(this.state.pitch >= 0.5 && this.state.pitch < 2){
    		const key = this.state.key+1;
    		const pitch = this.getPitchValue(key);

	        this.audioPlayer.pitch = pitch;
	        this.setState({key});
	        this.setState({pitch});
    	}
    }

    handleTempoChange(e) {
        const tempo = e.target.value;
        this.audioPlayer.tempo = tempo;
        this.setState({tempo});
    }

    decreaseTempo(e) {
    	if(this.state.tempo > 0.5 && this.state.tempo <= 2){
    		const tempo = +(Math.round(this.state.tempo-0.1 + "e+2")  + "e-2");
	        this.audioPlayer.tempo = tempo;
	        this.setState({tempo});
    	}
    }

    increaseTempo(e) {
        if(this.state.tempo >= 0.5 && this.state.tempo < 2){
    		const tempo = +(Math.round(this.state.tempo+0.1 + "e+2")  + "e-2");
	        this.audioPlayer.tempo = tempo;
	        this.setState({tempo});
    	}
    }

    handleSeek(e) {
        const percent = parseFloat(e.target.value);
        this.audioPlayer.seekPercent(percent);
        this.play();
    }

    percentDone() {
        if (!this.state.duration) {
            return 0;
        }

        return this.state.t / this.state.duration * 100;
    }

    getTime(){
        var result = "";
        if(this.state.duration!=null){
            var whole = this.state.duration;
            var whole_min = Math.floor(whole/60);
            var whole_sec = Math.floor(whole-whole_min*60);

            var current = this.state.t;
            var cur_min = Math.floor(current/60);
            var cur_sec = Math.floor(current-cur_min*60);

            result += ((cur_min<10)?("0"+cur_min):(cur_min))+":"+((cur_sec<10)?("0"+cur_sec):(cur_sec));
            result += "/";
            result += ((whole_min<10)?("0"+whole_min):(whole_min))+":"+((whole_sec<10)?("0"+whole_sec):(whole_sec));
        }
    	return result;
    }

	render (){
	  	return (

	  		<div className="Application">
	  		  <div className="row title_header alert alert-info">
	  		  	Karaoke
	  		  </div>

		      <div className="row" style={{marginBottom: '1em'}}>
                    <label
                        className="btn btn-primary btn-lg"
                        htmlFor="sas-file"
                        style={{marginRight: '0.25em'}}
                    >
                        <input
                            id="sas-file"
                            accept="audio"
                            type="file"
                            style={{display: 'none'}}
                            onChange={e => this.handleFileChange(e)}
                        />
                        Select MP3
                    </label>
                    <FilenameLabel error={this.state.error} filename={this.state.filename} />
                </div>

                <ErrorAlert error={this.state.error} />

                <div className="row">
                    <div className="" style={{paddingTop: '6px'}}>
                    	<TrackControls
                            action={this.state.action}
                            error={this.state.error}
                            filename={this.state.filename}
                            onPlay={() => this.play()}
                            onPause={() => this.pause()}
                            onStop={() => this.stop()}
                        />
                    </div>
                    <div>
                    	<p>{this.getTime()}</p>
                    </div>
                    <div className="ranger">
                        <input
                            className="form-control"
                            type="range"
                            min="0"
                            max="100"
                            step="0.05"
                            value={this.percentDone()}
                            onChange={e => this.handleSeek(e)}
                        />
                        <output className="bubble"></output>
                    </div>
                </div>

                <div className="row">
                   	<div className="">
                   		<button className="btns" type="button" onClick={e => this.decreasePitch(e)}> down </button>
	                        <p className="tagg"> Pitch ({ (this.state.key<0)?(this.state.key):("+"+this.state.key) } key) </p>
                    	<button className="btns" type="button" onClick={e => this.increasePitch(e)}> up </button>
                    </div>
                </div>

                <div className="row">
                    <div className="">
                    	<button className="btns" type="button" onClick={e => this.decreaseTempo(e)}> slow </button>
	                        <p className="tagg"> Tempo ({ parseFloat(this.state.tempo).toFixed(1) }x) </p>
                    	<button className="btns" type="button" onClick={e => this.increaseTempo(e)}> fast </button>
                    </div>
                </div>

                <div className="row">
                	<div>
                		<textarea rows="20" cols="30" placeholder="write the lyrics here..."></textarea>
                    </div>
                </div>

		    </div>

	    )
	}

}

export default Karaoke;
