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
const yts = require( 'yt-search' );
// const cors = require('cors');


// //Heroku requirements lines
// const whitelist = ['http://localhost:3000', 'http://localhost:5000', 'https://infinity-coin-karaoke.heroku...'];
// const corsOptions = {
//   origin: function (origin, callback) {
//     console.log("** Origin of request " + origin)
//     if (whitelist.indexOf(origin) !== -1 || !origin) {
//       console.log("Origin acceptable")
//       callback(null, true)
//     } else {
//       console.log("Origin rejected")
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }
// app.use(cors(corsOptions))
// if (process.env.NODE_ENV === 'production') {
//   // Serve any static files
//   app.use(express.static(path.join(__dirname, 'client/build')));
// // Handle React routing, return all requests to React app
//   app.get('*', function(req, res) {
//     res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
//   });
// }



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

//get a list of search result
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

//get search title and return list of searched video info
app.get('/api/youtubeSearch', async function (req, res) {
	if(req.query.title != null){
		var title = req.query.title;
		var list = await getSearchResult(title);
		res.contentType('application/json');
		res.send(JSON.stringify(list));
	}
});

//return requested file from downloads directory
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

//send the piped youtube video to client diretly
app.get('/api/music', async function (req, res) {
	if(req.query.url != null && req.query.title != null){
		var url = req.query.url;
		res.writeHead(200, {
	        'Content-Type': 'audio/mpeg'
	    });
	    ytdl(url, {quality: '18',} ).pipe(res);
	}else{
		res.send('audio file is not specified.',);
	}
}).listen(2000);

//download video and pipe the downloaded video to client
/*
app.get('/api/music', async function (req, res) {
	if(req.query.url != null && req.query.title != null){
		var url = req.query.url;
		var title = req.query.title;
		await downloadYT(url,title);
		await moveYTFile(title);
		var filePath = path.join(__dirname, '/downloads/'+title+'.mp4');
		var stat = fs.statSync(filePath);
		res.writeHead(200, {
	        'Content-Type': 'audio/mpeg'
	    });
	    var readStream = fs.createReadStream(filePath);
	    readStream.pipe(res);
	}else{
		res.send('audio file is not specified.',);
	}
}).listen(2002);
*/

app.listen(port, () => console.log(`Listening on port ${port}`));

