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
const yts = require( 'yt-search' )

/*

[0] {
[0]   type: 'video',
[0]   videoId: 'R-H3tcywlOA',
[0]   url: 'https://youtube.com/watch?v=R-H3tcywlOA',
[0]   title: 'Thorn 가시_Buzz 버즈_TJ노래방 (Karaoke/lyrics/romanization/KOREAN)',
[0]   description: 'Thorn -- Buzz -- TJ Karaoke Song NO. 14684 가시 -- 버즈 -- TJ노래방 곡번호 14684 If you want more K-Pop Karaoke? Subscribe ...',
[0]   image: 'https://i.ytimg.com/vi/R-H3tcywlOA/hq720.jpg',
[0]   thumbnail: 'https://i.ytimg.com/vi/R-H3tcywlOA/hq720.jpg',
[0]   seconds: 247,
[0]   timestamp: '4:07',
[0]   duration: { toString: [Function: toString], seconds: 247, timestamp: '4:07' },
[0]   ago: '6 years ago',
[0]   views: 1347294,
[0]   author: {
[0]     name: 'TJ KARAOKE TJ 노래방 공식 유튜브채널',
[0]     url: 'https://youtube.com/user/ziller'
[0]   }
[0] }


*/

//140 = audio only
//133 = 240p video only
//134 = 360p video only
//18 = 360p + audio
// ytdl('http://www.youtube.com/watch?v=kIbMYo7aO1s', {quality: '140',} ).pipe(fs.createWriteStream(yt_title+'.mp3'));
// ytdl('http://www.youtube.com/watch?v=kIbMYo7aO1s', {quality: '133',} ).pipe(fs.createWriteStream('133.mp4'));
// ytdl('http://www.youtube.com/watch?v=kIbMYo7aO1s', {quality: '134',} ).pipe(fs.createWriteStream(yt_title+'.mp4'));
// ytdl('http://www.youtube.com/watch?v=kIbMYo7aO1s', {quality: '18',} ).pipe(fs.createWriteStream('18.mp4'));


const moveYTFile = async (yt_title) => {
  // Move file ./bar/foo.js to ./baz/qux.js
  var newLocation = 'downloads/'+yt_title+'.mp4';
  const mp3_orig = await join(__dirname, yt_title+'.mp4');
  const mp3_tar = await join(__dirname, 'downloads/'+yt_title+'.mp4'); 
  await mv(mp3_orig, mp3_tar);
}

async function downloadYT (yt_url,yt_title) {
  var filePath = path.resolve(__dirname, '/'+yt_title+'.mp4');
  const writer = fs.createWriteStream(yt_title+'.mp4');

  // pipe the result stream into a file on disc
  const response = await ytdl(yt_url, {quality: '18',} ).pipe(writer);
  // return a promise and resolve when download finishes
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}



async function getSearchResult (title) {
	const r = await yts(title);
	const videos = r.videos.slice( 0, 10 );
	var result = [];
	videos.forEach( function ( v ) {
		if(v.seconds <= 300){
			var title = v.title.replaceAll('/','').replaceAll(/\s\s+/g, ' ');
			result.push({title: title, time: v.timestamp, url: v.url, author: v.author.name, thumbnail: v.thumbnail});
		}
	} );
	return result;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/files', (req, res) => {
	var files = {
	  	music : []
	  };
	var music_files = fs.readdirSync('./downloads/');
	music_files.forEach(file => {
    	if( !(/^\./.test(file)) ){
    		files.music.push({
	    		"filename" : file
	    	});
    	}
	});
	res.contentType('application/json');
	res.send(JSON.stringify(files));
});

app.get('/api/youtubeSearch', async function (req, res) {
	if(req.query.title != null){
		var title = req.query.title;
		var list = await getSearchResult(title);
		res.contentType('application/json');
		res.send(JSON.stringify(list));
	}
});

app.get('/api/savedMusic', (req, res) => {
	if(req.query.file != null){
		var file_name = req.query.file;
		var filePath = path.join(__dirname, '/downloads/'+file_name);
		var stat = fs.statSync(filePath);

		res.writeHead(200, {
	        'Content-Type': 'audio/mpeg',
	        'Content-Length': stat.size
	    });

	    var readStream = fs.createReadStream(filePath);
	    readStream.pipe(res);
	}else{
		res.send( 'file is not specified.',);
	}
}).listen(2001);

app.get('/api/music', async function (req, res) {
	if(req.query.url != null && req.query.title != null){
		var url = req.query.url;
		var title = req.query.title;

		//await downloadYT(url,title);
		//await moveYTFile(title);

		//var filePath = path.join(__dirname, '/downloads/'+title+'.mp4');
		//var stat = fs.statSync(filePath);

		res.writeHead(200, {
	        'Content-Type': 'audio/mpeg'
	    });

	    //var readStream = fs.createReadStream(filePath);
	    //readStream.pipe(res);
	    ytdl(url, {quality: '18',} ).pipe(res);
	}else{
		res.send('audio file is not specified.',);
	}
}).listen(2002);

app.listen(port, () => console.log(`Listening on port ${port}`));

