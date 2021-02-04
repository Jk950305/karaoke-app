const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {join} = require('path');
const mv = promisify(fs.rename);

const ytdl = require('ytdl-core');

var cheerio = require('cheerio');
var request = require('request');

var popular_list;
var timestamp = new Date();


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
			    	result.top100.push({"title" : titles[i], "artist":artists[i]});
			    }
			    resolve(result);
			}else{
				reject(error);
			}
		});
	})
}

async function getTJTop100(){
	var url = 'http://www.tjmedia.co.kr/tjsong/song_monthPopular.asp';
	 await requestTJChart(url);
}







//move file directory
const moveYTFile = async (yt_title) => {
  var newLocation = 'downloads/'+yt_title+'.mp4';
  const mp3_orig = await join(__dirname, yt_title+'.mp4');
  const mp3_tar = await join(__dirname, 'downloads/'+yt_title+'.mp4'); 
  await mv(mp3_orig, mp3_tar);
}

//download video from youtube
async function downloadYT (yt_url,yt_title) {
  var filePath = path.resolve(__dirname, '/'+yt_title+'.mp4');
  const writer = fs.createWriteStream(yt_title+'.mp4');
  const response = await ytdl(yt_url, {quality: '18',} ).pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}


app.use(express.static(path.join(__dirname, 'client/build')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//get saved music in downloads directory
app.get('/api/files', (req, res) => {
	var files = {
	  	music : []
	};
	var music_files = fs.readdirSync('./downloads/');
	music_files.forEach(file => {
    	if( !(/^\./.test(file)) ){
    		files.music.push({ "filename" : file });
    	}
	});
	res.contentType('application/json');
	res.send(JSON.stringify(files));
});

app.get('/api/api_key', (req, res) => {
  res.send({ api_key: 'AIzaSyDFKwmhFGxp0zBK3ddDmFOX9N65G_3F23k' });
});



//send the piped youtube video to client diretly
app.get('/api/music', async function (req, res) {
	if(req.query.url != null && req.query.title != null){
		var url = req.query.url;
		res.writeHead(200, {
	        'Content-Type': 'video/mp4'
	    });
	    ytdl(url, {quality: '18',} ).pipe(res);
	}else{
		res.send('source is not specified.',);
	}
}).listen(2000);

//download video and pipe the downloaded video to client

app.get('/api/download', async function (req, res) {
	if(req.query.url != null && req.query.title != null){
		var url = req.query.url;
		var title = req.query.title;
		await downloadYT(url,title);
		await moveYTFile(title);
		var filePath = path.join(__dirname, '/downloads/'+title+'.mp4');
	    res.download(filePath);
	}else{
		res.send('source is not specified.',);
	}
}).listen(2001);

app.get('/api/TJ', async function (req, res) {
	var chart;
	var max_date = new Date(timestamp);
	max_date.setDate(timestamp.getDate()+1);
	var cur_date = new Date();
	if(popular_list && cur_date<max_date){
		chart = popular_list;
	}else{
		var url = 'http://www.tjmedia.co.kr/tjsong/song_monthPopular.asp';
		chart = await requestTJChart(url);
		popular_list = chart;
		timestamp = new Date();
	}
	res.contentType('application/json');
	res.send(JSON.stringify(chart));
});

app.get('/api/api_key', (req, res) => {
  res.send({ api_key: 'AIzaSyDFKwmhFGxp0zBK3ddDmFOX9N65G_3F23k' });
});

// app.post('/api/world', (req, res) => {
//   console.log(req.body);
//   res.send(
//     `I received your POST request. This is what you sent me: ${req.body.post}`,
//   );
// });


app.listen(port, () => console.log(`Listening on port ${port}`));

