import FilenameLabel from'./FilenameLabel.jsx';
import ErrorAlert from'./ErrorAlert.jsx';
import AudioPlayer from './../lib/AudioPlayer';
import axios from 'axios';

const EventEmitter = require('events').EventEmitter;
const React = require('react');

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
            yt_title: "",
            yt_url: "",
            yt_list: [],
            loading: "",
            latency: 0.0,
        };

        //create an observer
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


        //create an audio player
        this.audioPlayer = new AudioPlayer({
            emitter: this.emitter,
            pitch: this.state.pitch,
            tempo: this.state.tempo,
        });

        //initialize in-app helper variables and functions
        this.inputRef = React.createRef();
        this.handleSeek = this.handleSeek.bind(this);
        this.handleTitle = this.handleTitle.bind(this);
        this.handleURL = this.handleURL.bind(this);
        this.loadFile = this.loadFile.bind(this);
    }

/* React Page related methods */
    //At the beginning of the app
    componentDidMount() {
        this.stop();
    }
    //At the end of the app
    componentWillUnmount() {
        this.stop();
    }

/* Video&Audio player methods */
    //only gets called from video player
    play() {
        if (this.state.action !== 'play') {
            this.audioPlayer.play();
            this.setState({action: 'play'});
            this.ref.current.playbackRate = this.state.tempo;
        }
    }
    //called iff video player is paused
    pause() {
        if (this.state.action === 'play') {
            this.audioPlayer.pause();
            this.setState({action: 'pause'});
        }
    }
    //gets called when video player onStop()
    stop() {
        this.pause();
        this.audioPlayer.seekPercent(0);
        this.setState({action: 'stop', t: 0});
        this.ref.current.currentTime = 0;
        this.ref.current.pause();
    }
    //get file inputs from user to be played
    handleFileChange(e) {
        e.preventDefault();
        if (e.target.files.length > 0) {
            this.stop();
            this.setState({showPL : false,loading:'loading'});
            var filename = e.target.value.replace('C:\\fakepath\\', '');
            filename = filename.substring(0,filename.length-4)
            const file = e.target.files[0];
            this.loadFile(file,filename);
        }
    }
    //handle seek in video player
    handleSeek(e) {
        e.preventDefault();
        if(this.ref.current!=null && !this.ref.current.paused && this.state.loading==='loaded'){
            var current = this.ref.current.currentTime;
            if(current<this.prev-0.5*this.state.tempo || this.prev+0.5*this.state.tempo<current || current<0.5){
                const percent = ( parseFloat(this.ref.current.currentTime) + parseFloat(this.state.latency) ) / this.state.duration*100;
                this.audioPlayer.seekPercent(percent);
                this.play();
            } 
            this.prev = current;
        }
    }
    syncMusic(e){
        e.preventDefault();
        if(this.ref.current!=null && !this.ref.current.paused && this.state.loading==='loaded'){
            const percent = (parseFloat(this.ref.current.currentTime)+parseFloat(this.state.latency))/this.state.duration*100;
            this.audioPlayer.seekPercent(percent);
            this.play();
        }
    }
    //load file and play blob on both audio & video
    loadFile(file,filename) {
        this.emitter.emit('status', 'Reading file...');
        this.emitter.emit('state', {
            error: undefined,
            filename: undefined,
        });
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
            this.setState({loading: 'loaded'});
        };
    }


/* API related methods */

    //get music filenames from server
    getFiles = async () => {
        const response = await fetch('/api/files');
        const body = response.json();
        if (response.status !== 200) throw Error(body.message);
        return body;
    };

    //clear media and get new media blob
    async getMedia(e,yt_title,yt_url){
        e.preventDefault();

        this.setState({yt_list:[],yt_title:""});
        this.getMusic(yt_url,yt_title);
    }

    //get video blob
    async getMusic(yt_url,yt_title) {
        this.setState({showPL:false,loading:'loading'});
        this.stop();
        var file;

        var url = '/api/music?url='+yt_url+'&title='+yt_title;

        await fetch( url, {
            method: 'GET',
            headers: {},
        }).then(function (response) {
            return response.blob();
        }).then(function(blob) {
            file = blob;
        }).catch(error => {});
        this.loadFile(file,yt_title);
    }


/* HTML related methods */
    //toggle the list of saved music

    //handle input text for title of youtube in search box
    handleTitle(e){
        this.setState({yt_title : e.target.value});
    }
    handleURL(e){
        this.setState({yt_url : e.target.value});
    }
    getVideoFromYoutube(e){
        e.preventDefault();
        var url = e.target[0].value;
        this.setState({yt_list:[],yt_title:""});
        this.getMusic(url,url.substring(url.length-6));
    }

    //send title to be searched to server and get short videos 
    async searchOnYoutube(e) {
        e.preventDefault();
        this.setState({showPL: false});
        var search_title = e.target[1].value;
        const api_key='AIzaSyC6keBXIih9rgJPf3KyzWrplSBLS_YugJI';
        const youtube = axios.create({
            baseURL:'https://www.googleapis.com/youtube/v3',
            params:
            {
                part:'id,snippet',
                maxResults:5,
                key: api_key
            }
        });
        const res = await youtube.get('/search', {params: { q: search_title }});
        var result = [];
        var tmp = ""
        for(let i=0;i<res.data.items.length;i++){
            tmp += (i===0)?(""):(",");
            tmp += res.data.items[i].id.videoId;
        }

        const youtube2 = axios.create({
            baseURL:'https://www.googleapis.com/youtube/v3',
            params:{ part:'contentDetails', key: api_key }
            });
        const details = await youtube2.get('/videos', {params: {id: tmp }});

        for(let i=0;i<res.data.items.length;i++){
            var str = (details.data.items[i].contentDetails.duration).replace(/P|T|S/g,'').split('M');
            var sec = (str[1].length>1)?(str[1]):("0"+str[1]);
            var duration = str[0]+":"+sec;
            if(str[0] <= 5){
                var v = res.data.items[i].snippet;
                var url = "http://www.youtube.com/watch?v="+res.data.items[i].id.videoId;
                var title = v.title.replaceAll('/','').replaceAll(/\s\s+/g, ' ');
                result.push({title: title, time: duration, url: url, author: v.channelTitle, thumbnail: v.thumbnails.medium.url});
            }
        }
        this.setState({yt_list: result});
    }

    //reload the app
    refreshPage(e){
        e.preventDefault();
        window.location.reload();
    }


/* Soundsource related methods */
    //get adjusted pitch value
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
    getPitchValue(val) {
        var s_var = (val>=0)?(parseInt(val)):(12+parseInt(val));
        //https://en.wikipedia.org/wiki/12_equal_temperament
        var num = Math.pow(2, (s_var/12)).toFixed(3);
        const pitch = (val>=0)?(num):(num/2);
        return pitch;
    }

    //Handle Tempo Changes 
    decreaseTempo(e) {
        e.preventDefault();
        if(this.state.tempo > 0.5 && this.state.tempo <= 2){
            const tempo = +(Math.round(this.state.tempo-0.1 + "e+2")  + "e-2");
            this.audioPlayer.tempo = tempo;
            this.setState({tempo});
            this.ref.current.playbackRate = tempo;
        }
    }
    increaseTempo(e) {
        e.preventDefault();
        if(this.state.tempo >= 0.5 && this.state.tempo < 2){
            const tempo = +(Math.round(this.state.tempo+0.1 + "e+2")  + "e-2");
            this.audioPlayer.tempo = tempo;
            this.setState({tempo});
            this.ref.current.playbackRate = tempo;
        }
    }

    //Handle Latency Changes 
    decreaseLatency(e) {
        e.preventDefault();
        if(this.state.latency > 0 && this.state.latency <= 2){
            const latency = +(Math.round(this.state.latency-0.1 + "e+2")  + "e-2");
            this.setState({latency});
            var cur = parseFloat(this.ref.current.currentTime)+parseFloat(latency);
            const percent = cur/this.state.duration*100;
            this.audioPlayer.seekPercent(percent);
            if(!this.ref.current.paused){
                this.play();
            }
        }
    }
    increaseLatency(e) {
        e.preventDefault();
        if(this.state.latency >= 0 && this.state.latency < 2){
            const latency = +(Math.round(this.state.latency+0.1 + "e+2")  + "e-2");
            this.setState({latency});
            var cur = parseFloat(this.ref.current.currentTime)+parseFloat(latency);
            const percent = cur/this.state.duration*100;
            this.audioPlayer.seekPercent(percent);
            if(!this.ref.current.paused){
                this.play();
            }
        }
    }
    


	render (){

        //create a list of youtube search results
        var yt_list = [];
        for(const [key,value] of this.state.yt_list.entries()){
            yt_list.push(<tr key={key}><td>
                <div className="yt_element" onClick={e => this.getMedia(e,value.title,value.url)}>
                    <div className="yt_thumb">
                        <img src={value.thumbnail} alt="" className="yt_image"/>
                        <p className="yt_time">({value.time})</p>
                    </div>
                    <div className="yt_info">
                        <p className="yt_title">{value.title}</p>
                        <p className="yt_author">{value.author}</p> 
                    </div>
                </div></td></tr>
            );
        }

	  	return (
	  		<div className="Karaoke">
                <div id="header" className="title_header alert alert-info" onClick={e => this.refreshPage(e)}>
	  		  	    Infinity Coin Karaoke
                </div>

                <div className="row">
                    <label
                        className="btn btn-primary btn-md file-btns"
                        htmlFor="upload-file"
                        style={{marginRight: '0.25em', marginBottom: '1em'}}
                    >
                        <input
                            id="upload-file"
                            accept="video"
                            type="file"
                            style={{display: 'none'}}
                            onChange={e => this.handleFileChange(e)}
                        />
                        Upload from Your Device
                    </label>

                </div>

                <div className="row">
                    <form onSubmit={e => this.searchOnYoutube(e)} className="youtube-form">
                        <input type="text" autoFocus="autofocus" style={{display:"none"}} />
                        <input id="yt_title" value={this.state.yt_title} onChange={e => this.handleTitle(e)} type="text" placeholder="Search on Youtube" className="form-control"/>
                        <input type="submit" className="btn btn-danger btn-md" value="Search"/>
                    </form>
                </div>

                <ErrorAlert error={this.state.error} />
            

                <div className="yt_table" style={{display: (this.state.yt_list.length>0)?('initial'):('none')}}>
                    <hr/> 
                    <div className="row">
                        <table className=" table table-hover">
                            <tbody>
                                    {yt_list}
                            </tbody>
                        </table>
                    </div>
                </div>


                <div style={{display: (this.state.loading ==='loaded')?('initial'):('none')}}>
                    <hr/> 
                    <div className="row">
                        <FilenameLabel error={this.state.error} filename={this.state.filename} />
                        <div>
                            <video muted ref={this.ref} src={this.state.file} id="my-video" className="vid" controls onTimeUpdate={e => this.handleSeek(e)} onPlay={e => this.syncMusic(e)} onPause={this.pause.bind(this)} controlsList="nodownload" disablePictureInPicture autoPlay>
                            </video>
                            <a className="btn btn-secondary" href={this.state.file} download={this.state.filename+".mp4"}>download</a>
                        </div>
                    </div>
                    <br/>


                    <div className="container">
                        <div className="row">
                            <div className="col-sm">
                                <button type="button" onClick={e => this.decreasePitch(e)} className="btn btns btn-secondary"> - </button>
                            </div>
                            <div className="col-sm tagg">
                                <p> 
                                    Pitch ({ (this.state.key<0)?(this.state.key):("+"+this.state.key) } key) 
                                </p>
                            </div>
                            <div className="col-sm">
                                <button type="button" onClick={e => this.increasePitch(e)} className="btn btns btn-secondary"> + </button>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm">
                                <button type="button" onClick={e => this.decreaseTempo(e)} className="btn btns btn-secondary"> - </button>
                            </div>
                            <div className="col-sm tagg">
                                <p> Tempo ({ parseFloat(this.state.tempo).toFixed(1) }x) </p>
                            </div>
                            <div className="col-sm">
                                <button type="button" onClick={e => this.increaseTempo(e)} className="btn btns btn-secondary"> + </button>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm">
                                <button type="button" onClick={e => this.decreaseLatency(e)} className="btn btns btn-secondary"> - </button>
                            </div>
                            <div className="col-sm tagg">
                                <p>
                                    Audio Latency ({ (this.state.latency<0)?(this.state.latency):("+"+this.state.latency) } sec) 
                                </p>
                            </div>
                            <div className="col-sm">
                                <button type="button" onClick={e => this.increaseLatency(e)} className="btn btns btn-secondary"> + </button>
                            </div>
                        </div>
                    </div>




                </div>
                <div style={{width:'100%', display: (this.state.loading ==='loading')?('initial'):('none')}}>
                    <img src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif" style={{ width:'50%',marginLeft:'25%', marginRight:'25%'}} alt="loading..." />
                </div>
		    </div>

	    )
	}

}

export default Karaoke;
