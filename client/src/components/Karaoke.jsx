import FilenameLabel from'./FilenameLabel.jsx';
import PopularList from'./PopularList.jsx';
import Controller from'./Controller.jsx';
import YoutubeList from'./YoutubeList.jsx';
import ErrorAlert from'./ErrorAlert.jsx';
import Playlist from'./Playlist.jsx';
//import Modal from'./Modal.jsx';
import AudioPlayer from './../lib/AudioPlayer';
import axios from 'axios';


const EventEmitter = require('events').EventEmitter;
const React = require('react');

class Karaoke extends React.Component {

	constructor(props) {
        super(props);
        this.ref = React.createRef();
        this.sub = React.createRef();
        this.state = {
            action: 'stop',
            duration: undefined,
            error: undefined,
            filename: undefined,
            pitch: 1.0,
            pitch_key: 0,
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
            api_key: "",
            kr_chart: [],
            en_chart: [],
            chartPage: 0,
            ios_click: false,
            queue: [],
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

        this.handlePitch = this.handlePitch.bind(this);
        this.handleTempo = this.handleTempo.bind(this);
        this.handleLatency = this.handleLatency.bind(this);

        this.loadFile = this.loadFile.bind(this);
        this.getMedia = this.getMedia.bind(this);

        this.toggleTJChart = this.toggleTJChart.bind(this);
        this.findOnYoutube = this.findOnYoutube.bind(this);
        this.moveChart = this.moveChart.bind(this);
        this.resetChart = this.resetChart.bind(this);

        this.enqueueMusic = this.enqueueMusic.bind(this);
        this.removeFromQueue = this.removeFromQueue.bind(this);
        this.playNext = this.playNext.bind(this);
    }

/* React Page related methods */
    //At the beginning of the app, get api key and playlists
    componentDidMount() {
        this.stop();
        this.getApiKey()
            .then(res => this.saveApiKey(res))
                .catch(err => console.log(err));
        this.getTJChart()
            .then(res => this.setState({ kr_chart: res.top100 }))
                .catch(err => console.log(err));
        this.getSingKingPlaylist()
            .then(res => this.setState({ en_chart: res}))
                .catch(err => console.log(err));
    }
    //At the end of the app
    componentWillUnmount() {
        this.stop();
    }

    saveApiKey(api_key){
        this.setState({ api_key: api_key });
        return api_key;
    }

    getApiKey = async () => {
        const response = await fetch('/api/api_key');
        const body = await response.json();
        if (response.status !== 200) throw Error(body.message);
        return body.api_key;
    };

/* Video&Audio player methods */
    //only gets called from video player
    play() {
        if (this.state.action !== 'play') {
            this.audioPlayer.play();
            this.setState({action: 'play'});
            this.ref.current.playbackRate = this.state.tempo;
            this.sub.current.playbackRate = this.state.tempo;
            // this.sub.current.play();
        }
    }
    //called iff video player is paused
    pause() {
        if (this.state.action === 'play') {
            this.audioPlayer.pause();
            this.setState({action: 'pause'});
            this.sub.current.pause();
        }
    }
    //gets called when video player onStop()
    stop() {
        this.pause();
        this.audioPlayer.seekPercent(0);
        this.setState({action: 'stop', t: 0});
        this.ref.current.currentTime = 0;
        this.ref.current.pause();
        this.sub.current.currentTime = 0;
        this.sub.current.pause();
    }
    //get file inputs from user to be played
    handleFileChange(e) {
        e.preventDefault();
        this.setState({yt_list:[],yt_title:"",chartPage:0});
        if (e.target.files.length > 0) {
            this.stop();
            this.setState({chartPage : 0,loading:'loading'});
            var filename = e.target.value.replace('C:\\fakepath\\', '');
            filename = filename.substring(0,filename.length-4)
            const file = e.target.files[0];
            this.loadFile(file,filename);
        }
    }
    //handle seek in video player
    handleSeek(e) {
        e.preventDefault();
        this.handleVolume(e);
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
    handleVolume(e){
        e.preventDefault();
        if(this.ref.current!=null){
            this.ref.current.volume = 0.0;
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
        this.setState({chartPage:0,loading:'loading'});
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

    async getTJChart() {
        const response = await fetch('/api/TJ');
        //const response = await fetch('http://localhost:5001/api/TJ');
        if (response.status !== 200) {
            const error = await response.json(); // read error message
            throw Error(error.message || 'Failed to fetch');
        }
        return await response.json();
    }

    async getSingKingPlaylist(){
        const response = await fetch('/api/SingKing');
        const body = response.json();
        if (response.status !== 200) throw Error(body.message);
        return body;
    };


/* HTML related methods */
    //toggle the list of saved music

    //handle input text for title of youtube in search box
    handleTitle(e){
        e.preventDefault();
        this.setState({yt_title : e.target.value});
    }
    handleURL(e){
        e.preventDefault();
        this.setState({yt_url : e.target.value});
    }
    getVideoFromYoutube(e){
        e.preventDefault();
        var url = e.target[0].value;
        this.setState({yt_list:[],yt_title:""});
        this.getMusic(url,url.substring(url.length-6));
    }

    //send title to be searched to server and get short videos 
    searchOnYoutube(e) {
        e.preventDefault();
        this.setState({chartPage: 0});
        var search_title = e.target[1].value;
        this.requestYoutubeSearch(search_title);
    }

    findOnYoutube(e){
        e.preventDefault();
        var search_title = e.target.textContent;
        this.requestYoutubeSearch(search_title);
        this.setState({chartPage:0});
    }

    async requestYoutubeSearch(search_title) {
        const api_key= this.state.api_key;
        const youtube = axios.create({
            baseURL:'https://www.googleapis.com/youtube/v3',
            params:
            {
                part:'id,snippet',
                maxResults:10,
                key: api_key
            }
        });
        const res = await youtube.get('/search', {params: { q: search_title+" karaoke" }});
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
        var count = (res.data.items.length<5)?(res.data.items.length):(5);

        for(let i=0;i<count;i++){
            if(details.data.items[i] && res.data.items[i].id.videoId){

                //get hour, min, and sec
                var str = details.data.items[i].contentDetails.duration;
                var hour, min, sec;
                var num = "";
                for(let j=0;j<str.length;j++){
                    switch(str[j]){
                        case 'P': break;
                        case 'T': break;
                        case 'H':
                            hour = "0".repeat(2-num.length)+num;
                            num = "";
                            break;
                        case 'M':
                            min = "0".repeat(2-num.length)+num;
                            num = "";
                            break;
                        case 'S':
                            sec = "0".repeat(2-num.length)+num;
                            num = "";
                            break;
                        default:
                            num += str[j];
                            break;
                    }
                }

                //fill empty fields
                hour = (hour===undefined)?('00'):(hour);
                min = (min===undefined)?('00'):(min);
                sec = (sec===undefined)?('00'):(sec);

                //get duration
                var duration = (hour==="00")?(min+":"+sec):(hour+":"+min+":"+sec);

                if(hour==="00" && min<="05" && min>="02"){
                    var v = res.data.items[i].snippet;
                    var url = "http://www.youtube.com/watch?v="+res.data.items[i].id.videoId;
                    var title = v.title.replace(/\\|\//g,'').replace(/\s\s+/g, ' ');
                    result.push({title: title, time: duration, url: url, author: v.channelTitle, thumbnail: v.thumbnails.medium.url});
                }
            }else{
                count++;
            }
        }
        if(result.length===0){
            result.push({message: 'No Search Results Found.'});
        }
        this.setState({yt_list: result});
    }

    //reload the app
    refreshPage(e){
        e.preventDefault();
        window.location.reload();
    }


/* Soundsource related methods */
    //handle pitch changes
    handlePitch(e){
        e.preventDefault();
        var btn_id = e.target.id;
        var pitch_key = this.state.pitch_key;
        if(btn_id==="decreasePitch"){
            pitch_key = this.state.pitch_key-1;
        }else if(btn_id==="increasePitch"){
            pitch_key = this.state.pitch_key+1;
        }
        const pitch = this.getPitchValue(pitch_key);
        this.audioPlayer.pitch = pitch;
        this.setState({pitch_key});
        this.setState({pitch});
    }
    //get adjusted pitch value
    getPitchValue(val) {
        var s_var = (val>=0)?(parseInt(val)):(12+parseInt(val));
        //https://en.wikipedia.org/wiki/12_equal_temperament
        var num = Math.pow(2, (s_var/12)).toFixed(3);
        const pitch = (val>=0)?(num):(num/2);
        return pitch;
    }

    //Handle Tempo Changes
    handleTempo(e){
        e.preventDefault();
        var btn_id = e.target.id;
        var val = 0;
        if(btn_id==="decreaseTempo"){
            val = -0.1;
        }else if(btn_id==="increaseTempo"){
            val = 0.1;
        }
        const tempo = +(Math.round(this.state.tempo+val + "e+2")  + "e-2");
        this.audioPlayer.tempo = tempo;
        this.setState({tempo});
        this.ref.current.playbackRate = tempo;
    }

    //Handle Latency Changes 
    handleLatency(e){
        e.preventDefault();
        var btn_id = e.target.id;
        var val = 0;
        if(btn_id==="decreaseLatency"){
            val = -0.1;
        }else if(btn_id==="increaseLatency"){
            val = 0.1;
        }
        const latency = +(Math.round(this.state.latency+val + "e+2")  + "e-2");
        this.setState({latency});
        var cur = parseFloat(this.ref.current.currentTime)+parseFloat(latency);
        const percent = cur/this.state.duration*100;
        this.audioPlayer.seekPercent(percent);
        if(!this.ref.current.paused){ this.play(); }

    }

    toggleTJChart(e){
        e.preventDefault();
        var newPage = (this.state.chartPage===0)?(1):(0);
        if(newPage>0){this.setState({yt_list:[],yt_title:""});}
        this.setState({chartPage : newPage});
    }

    moveChart(e){
        e.preventDefault();
        var txt = e.target.textContent;
        switch(txt){
            case 'next' : 
                this.setState({chartPage: this.state.chartPage+1});
                break;
            case 'prev' : 
                this.setState({chartPage: this.state.chartPage-1});
                break;
            default:
                break;
        }
    }
    resetChart(){
        this.setState({chartPage: 1});
    }

    handleSub(e){
        e.preventDefault();
        this.setState({ios_click : true});
    }

    enqueueMusic(e,title,url){
        e.preventDefault();
        var queue = this.state.queue;
        queue.push({title:title, url:url});
        this.setState({yt_list:[],yt_title:""});
    }

    removeFromQueue(e,index){
        e.preventDefault();
        var queue = this.state.queue;
        queue.splice(index,1);
        this.setState({queue:queue});
    }

    playNext(e){
        e.preventDefault();
        var queue = this.state.queue;
        if(queue.lenth<=0) return;
        var elem = queue[0];
        queue.splice(0,1);
        this.setState({queue:queue});
        this.getMedia(e,elem.title,elem.url);
    }


	render (){

	  	return (
	  		<div className="Karaoke">
                {/*<div class="row">
                  <div class="col-md-3">col</div>
                  <div class="col-md-3">col</div>
                  <div class="col-md-3">col</div>
                  <div class="col-md-3">col</div>
                </div>*/}

                <div id="header" className="title_header alert alert-info" onClick={e => this.refreshPage(e)}>
                    <div>Infinite Coin Karaoke</div>
                    <div style={{marginLeft:'90%', fontSize:'0.3em'}}>JK</div>
                </div>

                



                <div className="row" >
                    <ErrorAlert error={this.state.error} />
                    <hr/>

                    <div className="col-md-6">
                         
                        <div className="row">
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

                                <button className="btn btn-primary btn-md file-btns" style={{marginRight: '0.25em', marginBottom: '1em'}} onClick={e => this.toggleTJChart(e)}>{(this.state.chartPage>0)?('Hide'):('Show')} Popular Songs</button>

                            </div>

                            <div className="row">
                                <form onSubmit={e => this.searchOnYoutube(e)} className="youtube-form">
                                    <input type="text" autoFocus="autofocus" style={{display:"none"}} />
                                    <input id="yt_title" value={this.state.yt_title} onChange={e => this.handleTitle(e)} type="text" autoComplete="off" placeholder="Search on Youtube" className="form-control"/>
                                    <input type="submit" className="btn btn-danger btn-md" value="Search"/>
                                </form>
                            </div>

                            <PopularList
                                en_chart={this.state.en_chart}
                                kr_chart={this.state.kr_chart}
                                chartPage={this.state.chartPage}
                                findOnYoutube={this.findOnYoutube}
                                moveChart={this.moveChart}
                                resetChart={this.resetChart}
                                getMedia = {this.getMedia}
                            />
                        

                            <YoutubeList 
                                yt_list = {this.state.yt_list}
                                getMedia = {this.getMedia}
                                action = {this.state.action}
                                loading = {this.state.loading}
                                enqueueMusic = {this.enqueueMusic}
                                queue={this.state.queue} 
                            />



                        </div>
                        <br/>


                        
                    </div>
                    <div className="col-md-6">
                        <Playlist 
                            queue={this.state.queue} 
                            removeFromQueue={this.removeFromQueue}
                            getMedia = {this.getMedia}
                        />

                        <div style={{width:'100%', display: (this.state.loading ==='loading')?('initial'):('none')}}>
                            <img src="/loading_slug.png" style={{ width:'50%',marginLeft:'25%', marginRight:'25%'}} alt="loading..." />
                        </div>

                        <div style={{display: (this.state.loading ==='loaded')?('initial'):('none')}}>
                            <FilenameLabel error={this.state.error} filename={this.state.filename} />
                            <div>


                                {/*<Modal
                                    t = {this.state.t}
                                    duration = {this.state.duration}
                                    playNext={this.playNext}
                                    queue={this.state.queue}
                                    replay={this.replay}
                                />*/}
                                
                                <video
                                    ref={this.ref} 
                                    src={this.state.file} 
                                    id="my-video" 
                                    className="vid" 
                                    onTimeUpdate={e => this.handleSeek(e)} 
                                    onVolumeChange={e => this.handleVolume(e)}
                                    onPlay={e => this.syncMusic(e)} 
                                    onPause={this.pause.bind(this)} 
                                    controlsList="nodownload" 
                                    playsInline
                                    muted
                                    autoPlay
                                    controls
                                >
                                </video>
                                <div id="hidden_media" className="tip_message" style={{display: (this.state.ios_click)?('none'):('block')}}>
                                    <audio
                                        ref={this.sub}
                                        className="vid" 
                                        src="/silence.mp3"
                                        controls
                                        playsInline
                                        onClick={e=>this.handleSub(e)}
                                        style={{margin:'0'}}
                                    >
                                    </audio>
                                    <div className="tip_message" z-index='10' style={{width:'100px', margin:'0', backgroundColor:'red'}}>
                                        <p style={{fontSize:'0.8em', color:'white'}}>please click this button to play audio.</p>
                                    </div>

                                </div>
                                <Controller
                                    pitch_key={this.state.pitch_key}
                                    tempo={this.state.tempo}
                                    latency={this.state.latency}
                                    handlePitch={this.handlePitch}
                                    handleTempo={this.handleTempo}
                                    handleLatency={this.handleLatency}
                                    file={this.state.file}
                                    filename={this.state.filename}
                                    playNext={this.playNext}
                                    queue={this.state.queue}
                                />
                            </div>
                        </div>
                        
                            

                    </div>
                </div>

                






                <div className="row" id="ios_tips">
                    <hr/>
                    <p>* iOS users: please keep the video MUTED.</p>
                    <div style={{display:'inline'}}>
                        <p className="tip_message">* iOS users: please click
                        <img src="/playbtn.png" style={{ width:'30px', marginLeft:'3px', marginRight:'3px'}} alt="playbtn" />
                        to play audio.</p>
                    </div>
                    
                </div>
		    </div>

	    )
	}

}

export default Karaoke;
