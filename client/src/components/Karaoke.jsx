import FilenameLabel from'./FilenameLabel.jsx';
import TrackControls from'./TrackControls.jsx';
import ErrorAlert from'./ErrorAlert.jsx';

const EventEmitter = require('events').EventEmitter;
const React = require('react');
const AudioPlayer = require('./../lib/AudioPlayer');

class Karaoke extends React.Component {

	constructor(props) {
        super(props);

        this.ref = React.createRef();

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
            file: "",
            showPL : false,
            music_titles: [],
            yt_title: "",
            yt_url: "",
            yt_list: [],
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
        this.changeAudio = this.changeAudio.bind(this);
        this.handleURL = this.handleURL.bind(this);
        this.handleTitle = this.handleTitle.bind(this);
        this.loadFile = this.loadFile.bind(this);
        this.prev = 0;
    }

    play() {
        if (this.state.action !== 'play') {
            this.audioPlayer.play();
            this.setState({action: 'play'});
            this.ref.current.playbackRate = this.state.tempo;
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

            var fileURL = URL.createObjectURL(file);
            this.setState({file : fileURL});
            
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

                this.audioPlayer.setBuffer(buffer);
                
            };
            
            
        }
    }

    //https://prgomez.com/why-do-re-mi/
    getPitchValue(val) {
    	var num = 0;
    	var s_var = (val>=0)?(parseInt(val)):(12+parseInt(val));
    	switch(s_var){
    		case 0 : num = 1; break;
    		case 1 : num = 1.059; break;
    		case 2 : num = 1.122; break;
    		case 3 : num = 1.189; break;
    		case 4 : num = 1.26; break;
    		case 5 : num = 1.335; break;
    		case 6 : num = 1.414; break;
    		case 7 : num = 1.498; break;
    		case 8 : num = 1.587; break;
    		case 9 : num = 1.682; break;
    		case 10 : num = 1.782; break;
    		case 11 : num = 1.888; break;
    		case 12 : num = 2; break;
    		default : num = 1; break;
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
            this.ref.current.playbackRate = tempo;
    	}
    }

    increaseTempo(e) {
        if(this.state.tempo >= 0.5 && this.state.tempo < 2){
    		const tempo = +(Math.round(this.state.tempo+0.1 + "e+2")  + "e-2");
	        this.audioPlayer.tempo = tempo;
	        this.setState({tempo});
            this.ref.current.playbackRate = tempo;
    	}
    }

    handleSeek(e) {
    /*
        const percent = parseFloat(e.target.value);
        this.audioPlayer.seekPercent(percent);
        this.play();

        var current = this.state.duration*percent/100;
        this.ref.current.currentTime = current;
        */
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

            var cur_tempo = this.state.tempo;

            var whole = this.state.duration/cur_tempo;
            var whole_min = Math.floor(whole/60);
            var whole_sec = Math.floor(whole-whole_min*60);

            var current = this.state.t/cur_tempo;
            var cur_min = Math.floor(current/60);
            var cur_sec = Math.floor(current-cur_min*60);

            result += ((cur_min<10)?("0"+cur_min):(cur_min))+":"+((cur_sec<10)?("0"+cur_sec):(cur_sec));
            result += "/";
            result += ((whole_min<10)?("0"+whole_min):(whole_min))+":"+((whole_sec<10)?("0"+whole_sec):(whole_sec));
        }
    	return result;
    }

    componentDidMount() {
        this.stop();
        this.getMusicList();
    }

    componentWillUnmount() {
        this.stop();
    }

    getMusicList(){
        this.setState({music_titles:[]});
        this.getFiles()
            .then(
                res => {
                    for(var i=0;i<res.music.length;i++){
                        this.setState({ music_titles : this.state.music_titles.concat(res.music[i].filename) });
                    }
                }
            )
            .catch(err => console.log(err));

    }
      
    getFiles = async () => {
        const response = await fetch('/api/files');
        const body = await response.json();
        if (response.status !== 200) throw Error(body.message);
        return body;
    };

    async searchOnYoutube(e) {
        e.preventDefault();
        var title = e.target[0].value;
        const response = await fetch('/api/youtubeSearch?title='+title);
        const body = await response.json();
        if (response.status !== 200) throw Error(body.message);
        this.setState({yt_list: body});
    };

    async getSavedMusic(e) {
        this.setState({showPL:false});
        e.preventDefault();
        var file;
        var filename = e.target.outerText+".mp4";
        var url = '/api/savedMusic?file='+filename;
        await fetch( url, {
            method: 'GET',
            headers: {},
        }).then(function (response) {
                    return response.blob();
                }
            )
            .then(function(blob) {
                file = blob;
            })
            .catch(error => {
                //whatever
            });
        this.loadFile(file, filename);
    }

    async getMusic(yt_url,yt_title) {
        this.setState({showPL:false});

        var audio_file;

        var url = '/api/music?url='+yt_url+'&title='+yt_title;
        await fetch( url, {
            method: 'GET',
            headers: {},
        }).then(function (response) {
                    return response.blob();
                }
            )
            .then(function(blob) {
                audio_file = blob;
                return audio_file;
            })
            .catch(error => {
                //whatever
            });
        this.loadFile(audio_file,yt_title);
    }

    /*
    async getMedia(e){
        e.preventDefault();
        var yt_title = e.target[0].value;
        var yt_url = e.target[1].value;

        await this.getMusic(yt_url,yt_title);
        this.setState({ yt_title : "", yt_url : ""  });
    }
    */

    async getMedia(e,yt_title,yt_url){
        e.preventDefault();
        this.setState({yt_list:[],yt_title:""});
        await this.getMusic(yt_url,yt_title);

    }


    loadFile(file,filename) {
        this.stop();

        this.emitter.emit('status', 'Reading file...');
        this.emitter.emit('state', {
            error: undefined,
            filename: undefined,
        });

        // http://stackoverflow.com/q/4851595/786644
        this.emitter.emit('state', {filename});

        var fileURL = URL.createObjectURL(file);
        this.setState({file : fileURL});

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
            this.audioPlayer.setBuffer(buffer);
        };
        this.getMusicList();
    }

    showPlaylist(e){
        e.preventDefault();
        if(this.state.music_titles.length>0){
            this.setState({showPL : true});
        }
    }

    hidePlaylist(e){
        e.preventDefault();
        this.setState({showPL : false});
    }

    changeAudio(e) {
        e.preventDefault();
        var current = this.ref.current.currentTime;
        if(current<this.prev-0.5*this.state.tempo || this.prev+0.5*this.state.tempo<current){
            const percent = this.ref.current.currentTime/this.state.duration*100;
            this.audioPlayer.seekPercent(percent);
            this.play();
        }
        this.prev = current;
    }

    handleURL(e){
        this.setState({yt_url : e.target.value});
    }
    handleTitle(e){
        this.setState({yt_title : e.target.value});
    }

	render (){
        var items = [];
        for(const [key, value] of this.state.music_titles.entries()){
            items.push(<tr><td><a href="#header" key={key} onClick={e => this.getSavedMusic(e)}>{value.substring(0,value.indexOf('.'))}</a></td></tr>);
        }


        var yt_list = [];
        for(const [key, value] of this.state.yt_list.entries()){
            yt_list.push(
                <tr>
                    <td>
                        <div className="yt_element" onClick={e => this.getMedia(e,value.title,value.url)}>
                            <div className="yt_thumb">
                                <img src={value.thumbnail} alt="" className="yt_image"/>
                                <p className="yt_time">({value.time})</p>
                            </div>
                            <div className="yt_info">
                                <p className="yt_title">{value.title}</p>
                                <p className="yt_author">{value.author}</p> 
                            </div>
                        </div>
                    </td>
                </tr>);
        }


	  	return (

	  		<div className="Karaoke">
                <div id="header" className="row title_header alert alert-info">
	  		  	    Karaoke
                </div>

                <div className="row" style={{marginBottom: '1em', marginLeft:'auto', marginRight:'auto'}}>
                    <label
                        className="btn btn-primary btn-md"
                        htmlFor="upload-file"
                        style={{marginRight: '0.25em', marginBottom: '1em'}}
                    >
                        <input
                            id="upload-file"
                            accept="audio"
                            type="file"
                            style={{display: 'none'}}
                            onChange={e => this.handleFileChange(e)}
                            onClick={this.hidePlaylist.bind(this)}
                        />
                        Upload from Your Device
                    </label>
                    <button
                        className="btn btn-primary btn-md"
                        style={{marginLeft: '0.25em',marginBottom: '1em', display: (this.state.music_titles.length>0)?(''):('none')}}
                        id="choose-file"
                        onClick={(this.state.showPL)?(e => this.hidePlaylist(e)):(e => this.showPlaylist(e))}
                    >
                        {(!this.state.showPL)?('Show Saved Music'):('Hide Saved Music')}
                    </button>


                </div>
                
                {/*
                <div className="row">
                    <form onSubmit={e => this.getMedia(e)} >
                        <input id="yt_title" value={this.state.yt_title} onChange={e => this.handleTitle(e)} type="text" placeholder="title" className="form-control"/>
                        <input id="yt_url" value={this.state.yt_url} onChange={e => this.handleURL(e)} type="text" placeholder="url" className="form-control"/>
                        <input type="submit"/>
                    </form>

                </div>
                */}
                

                <div className="row">
                    <form onSubmit={e => this.searchOnYoutube(e)} >
                        <input id="yt_title" value={this.state.yt_title} onChange={e => this.handleTitle(e)} type="text" placeholder="Search on Youtube" className="form-control"/>
                        <input type="submit" className="btn btn-danger btn-md" value="Search"/>
                    </form>
                </div>

                <ErrorAlert error={this.state.error} />

                
                 
                <div className="row" style={{display : (this.state.showPL)?( 'initial' ):( 'none' )}}>
                    <hr/>
                    <div className="row">
                        <table className="music_table">
                            <tbody>
                                {items}
                            </tbody>
                        </table>
                        <a href="#" onClick={this.hidePlaylist.bind(this)}><p style={{float: 'right',fontSize:'10px'}}>close</p></a>
                    </div>
                    
                </div>
            

                <div className="yt_table" style={{display: (this.state.yt_list.length>0)?('initial'):('none')}}>
                    <hr/> 
                    <div className="row">
                        <div className="row">
                            <table>
                                <tbody>
                                        {yt_list}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>


                <div style={{display: (this.state.status[this.state.status.length-1]=='Playing file...')?('initial'):('none')}}>
                    <hr/> 
                    <div className="row">
                        <FilenameLabel error={this.state.error} filename={this.state.filename} />
                        <div>
                            <video muted ref={this.ref} src={this.state.file} id="my-video" className="vid" controls onTimeUpdate={e => this.changeAudio(e)} onPlay={this.play.bind(this)} onPause={this.pause.bind(this)} onLoad={e => this.loadVideo(e)} controlsList="nodownload" disablePictureInPicture>
                            </video>
                        </div>
                    </div>

                    <div className="row">
                        <div className="controls">
                            <button className="btns" type="button" onClick={e => this.decreasePitch(e)} className="btn btns btn-secondary"> - </button>
                            
                            <p className="tagg"> Pitch ({ (this.state.key<0)?(this.state.key):("+"+this.state.key) } key) </p>
                            
                            <button className="btns" type="button" onClick={e => this.increasePitch(e)} className="btn btns btn-secondary"> + </button>
                        </div>
                    </div>

                    <div className="row">
                        <div className="controls">
                            <button type="button" onClick={e => this.decreaseTempo(e)} className="btn btns btn-secondary"> - </button>
                            
                            <p className="tagg"> Tempo ({ parseFloat(this.state.tempo).toFixed(1) }x) </p>
                            
                            <button type="button" onClick={e => this.increaseTempo(e)} className="btn btns btn-secondary"> + </button>
                        </div>
                    </div>
                </div>
		    </div>

	    )
	}

}

export default Karaoke;
