const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

const path = require('path');
const {join} = require('path');
const fs = require('fs');
const http = require('http');

const ytdl = require('@distube/ytdl-core');

const cheerio = require('cheerio');
const request = require('request');

const cp = require('child_process'); 
const ffmpeg = require('ffmpeg-static'); 

const {google} = require('googleapis');
const api_keys = ['AIzaSyDrg3aXP84rkZwg4EADwiCnVwEOeeBPjhU', 'AIzaSyDutZWzNWjTAUZcW0V00ICgoTrmvdTRIsE'];

var tj_list;
var singking_list;
var timestamp = new Date();

function getApiKey(){
	const random = Math.floor(Math.random() * api_keys.length);
	const result = api_keys[random];
	return result;
}


function saveVideo(title, url){
    return new Promise(async function (resolve, reject){
    	await ytdl(url, {quality: '18',}).pipe(fs.createWriteStream('downloads/'+title+'.mp4'));
    });
}

function requestTJChart(url) {
	var titles = new Array();
    var artists = new Array();
    var result = {
    	top100 : []
    };
	return new Promise(function (resolve, reject) {
	    request(url, async function(error, response, html){
			if (!error) {
			    var $ = await cheerio.load(html);
			    //get titles
			    var i = 0;
			    $('#BoardType1 > table > tbody > tr > td:nth-child(3)').each(function(){
			    	var title_info = $(this);
			        var title_info_text = title_info.text();
			        titles[i] = title_info_text;
			        i++;
			    });

			    //get artists
			    var j=0;
			    $('#BoardType1 > table > tbody > tr > td:nth-child(4)').each(function(){
			        var artist_info = $(this);
			        var artist_info_text = artist_info.text();
			        artists[j] = artist_info_text;
			        j++;
			    });
			    //generate list
			    for (var i = 0; i < titles.length; i++) {
			    	result.top100.push({"title" : titles[i]+" - "+artists[i]});
			    }
			    resolve(result);
			}else{
				reject(error);
			}
		});
	})
}

function requestSingKingChart(){
	return new Promise(function(resolve, reject) {
		google.youtube('v3').playlistItems.list({
			key: getApiKey(),
			part: 'id,snippet',
			playlistId: 'PL8D4Iby0Bmm9y57_K3vBvkZiaGjIXD_x5',
			maxResults: 50,
		}).then((res) => {
			var arr = [];
		    for(var i=0;i<res.data.items.length;i++){
		        var title = res.data.items[i].snippet.title;
		        title = title.replace(' (Karaoke Version)','')
		        arr.push({"title" : title});
		    }
		    resolve(arr);
		}).catch((err) => reject(err));
	})
}

app.use(express.static(path.join(__dirname, 'client/build')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//get api_key
app.get('/api/api_key', (req, res) => {
	res.send({ api_key: getApiKey() });
 });


//send the piped youtube video to client diretly
app.get('/api/music', async function (req, res) {
	if(req.query.url != null && req.query.title != null){
		//await saveVideo(req.query.title, req.query.url);
		
		var title = req.query.title;
		var url = req.query.url;

		try {
		//res.writeHead(206, { 'Content-Type': 'video/mp4' });
		//ytdl(url, {quality: '160',}).pipe(fs.createWriteStream('downloads/'+title+'.mp4'));
        //ytdl(url, {quality: '160',}).pipe(res);
        //ytdl(url, {quality: '18',}aqz-KE).pipe(fs.createWriteStream('downloads/'+title+'.mp4'));
        	ytdl(url, {quality: '18',}).pipe(res);
        	//console.log(url)
        	//ytdl('http://www.youtube.com/watch?v=aqz-KE-bpKQ').pipe(fs.createWriteStream('video.mp4'));
        //ytdl(url).pipe(fs.createWriteStream('video.mp4'));
    	//ytdl(url, {filter: 'videoonly'}).pipe(fs.createWriteStream('downloads/'+title+'.mp4'));
        //ytdl(url, { filter: 'audioonly', highWaterMark: 1<<25}).pipe(res);

	        // var file = fs.createReadStream('shim.mp4');
			// file.pipe(res);

/*
        res.header('Content-Disposition', 'attachment;  filename=${title}.mkv');
        const video = ytdl(url, {filter: 'videoonly'});
        const audio = ytdl(url, { filter: 'audioonly', highWaterMark: 1<<25});
        // Start the ffmpeg child process
        const ffmpegProcess = cp.spawn(ffmpeg, [
            // Remove ffmpeg's console spamming
            '-loglevel', '0', '-hide_banner',
            '-i', 'pipe:4',
            '-i', 'pipe:5',
            '-reconnect', '1',
            '-reconnect_streamed', '1',
            '-reconnect_delay_max', '4',
            // Rescale the video
            '-vf', 'scale=1980:1080',
            // Choose some fancy codes
            '-c:v', 'libx265', '-x265-params', 'log-level=0',
            '-c:a', 'flac',
            // Define output container
            '-f', 'matroska', 'pipe:6',
        ], {
            windowsHide: true,
            stdio: [
            // Standard: stdin, stdout, stderr
            'inherit', 'inherit', 'inherit',
            // Custom: pipe:4, pipe:5, pipe:6
             'pipe', 'pipe', 'pipe',
            ],
        });

        audio.pipe(ffmpegProcess.stdio[4]);
        video.pipe(ffmpegProcess.stdio[5]);
        //ffmpegProcess.stdio[6].pipe(res); // Combining and piping the streams for download directly to the response
        console.log(ffmpegProcess.stdio[6]);
        ffmpegProcess.stdio[6].pipe(fs.createWriteStream('downloads/'+title+'.mp4'));
*/

/*
		//var path = 'downloads/'+title+'.mp4';
	    var path = 'video.mp4';
	    var stat = fs.statSync(path);
		var total = stat.size;

		if (req.headers.range) {

		    // meaning client (browser) has moved the forward/back slider
		    // which has sent this request back to this server logic ... cool


		    var range = req.headers.range;
		    var parts = range.replace(/bytes=/, "").split("-");
		    var partialstart = parts[0];
		    var partialend = parts[1];

		    var start = parseInt(partialstart, 10);
		    var end = partialend ? parseInt(partialend, 10) : total-1;
		    var chunksize = (end-start)+1;
		    console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

		    var file = fs.createReadStream(path, {start: start, end: end});
		    res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
		    file.pipe(res);

		} else {

		    console.log('ALL: ' + total);
		    res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
		    fs.createReadStream(path).pipe(res);
		}

*/
    	}catch(error){
    		console.log(error);
    	}

	}else{
		res.send('source is not specified.',);
	}
}).listen(2000);

app.get('/api/TJ', async function (req, res) {
	var chart;
	var max_date = new Date(timestamp);
	max_date.setMonth(timestamp.getMonth()+1);
	max_date.setDate(1);
	max_date.setHours(0, 0, 0, 0);

	var cur_date = new Date();

	var yesterday = new Date();
	
	yesterday.setDate(cur_date.getDate()-1);

	var e_year = yesterday.getFullYear();
	var e_month = yesterday.getMonth()+1;
	var e_day = yesterday.getDate();

	yesterday.setDate(yesterday.getDate()-30);

	var s_year = yesterday.getFullYear();
	var s_month = yesterday.getMonth()+1;
	var s_day = yesterday.getDate();

	

	s_month = (s_month<10)?("0"+s_month):(s_month);
	s_day = (s_day<10)?("0"+s_day):(s_day);
	e_month = (e_month<10)?("0"+e_month):(e_month);
	e_day = (e_day<10)?("0"+e_day):(e_day);

	if(tj_list && cur_date<max_date){
		chart = tj_list;
	}else{
		var url = 'http://www.tjmedia.co.kr/tjsong/song_monthPopular.asp';
		var new_url = 'http://www.tjmedia.com/tjsong/song_monthPopular.asp?strType=1&SYY='+s_year+'&SMM='+s_month+'&SDD='+s_day+'&EYY='+e_year+'&EMM='+e_month+'&EDD='+e_day;
		chart = await requestTJChart(new_url);
		tj_list = chart;
		timestamp = new Date();
	}
	res.contentType('application/json');
	res.send(JSON.stringify(chart));
});

app.get('/api/SingKing', async function (req, res) {
	var chart;
	var max_date = new Date(timestamp);
	max_date.setMonth(timestamp.getMonth()+1);
	max_date.setDate(1);
	max_date.setHours(0, 0, 0, 0);

	var cur_date = new Date();
	if(singking_list && cur_date<max_date){
		chart = singking_list;
	}else{
		chart = await requestSingKingChart();
		singking_list = chart;
		timestamp = new Date();
	}
	res.contentType('application/json');
	res.send(JSON.stringify(chart));
});

app.get('\download' , (req, res) => {
    const v_id = req.query.url.split('v=')[1];
    return res.render('download', {
        url: "https://www.youtube.com/embed/AOqFdxC3s_k",
    });
});

app.listen(port, () => console.log(`Listening on port ${port}`));

