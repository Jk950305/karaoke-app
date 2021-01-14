const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');

//soap request (Alsong Lyrics)
/*
var xml_str = """
				<?xml version="1.0" encoding="UTF-8"?>
				<SOAP-ENV:Envelope
				xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope"
				xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding"
				xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
				xmlns:xsd="http://www.w3.org/2001/XMLSchema"
				xmlns:ns2="ALSongWebServer/Service1Soap"
				xmlns:ns1="ALSongWebServer"
				xmlns:ns3="ALSongWebServer/Service1Soap12">
				<SOAP-ENV:Body><ns1:GetResembleLyricList2><ns1:encData>0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</ns1:encData>
				<ns1:title>텅빈거리에서</ns1:title>
				<ns1:artist>015B</ns1:artist>
				<ns1:pageNo>1</ns1:pageNo>
				</ns1:GetResembleLyricList2>
				</SOAP-ENV:Body></SOAP-ENV:Envelope>""";

const util = require('util')
const soapRequest = require('easy-soap-request');
const url = 'http://lyrics.alsong.co.kr/alsongwebservice/service1.asmx';
const sampleHeaders = {
  'Content-Type': 'application/soap+xml;charset=utf-8',
};
const xml = xml_str;
(async () => {
  const { response } = await soapRequest({ url: url, headers: sampleHeaders, xml: xml, timeout: 1000 }); // Optional timeout parameter(milliseconds)
  const { headers, body, statusCode } = response;
  console.log("\nheader = "+headers);
  console.log("\nbody = "+body);
  console.log("\nheader = "+statusCode);
  console.log("\nto text = "+response);
  console.log(util.inspect(response, false, null, true));
})();
*/

//youtube dl
// const youtubedl = require('youtube-dl')

// const video = youtubedl('http://www.youtube.com/watch?v=90AiXO1pAiA',
//   // Optional arguments passed to youtube-dl.
//   ['--format=18'],
//   // Additional options can be given for calling `child_process.execFile()`.
//   { cwd: __dirname })

// // Will be called when the download starts.
// video.on('info', function(info) {
//   console.log('Download started')
//   console.log('filename: ' + info._filename)
//   console.log('size: ' + info.size)
// })

// video.pipe(fs.createWriteStream('myvideo.mp4'))
const ytdl = require('ytdl-core');
//140 = audio only
//133 = 240p video only
//134 = 360p video only
//18 = 360p + audio
// ytdl('http://www.youtube.com/watch?v=kIbMYo7aO1s', {quality: '140',} )
//   .pipe(fs.createWriteStream('140.mp3'));
// ytdl('http://www.youtube.com/watch?v=kIbMYo7aO1s', {quality: '133',} )
//   .pipe(fs.createWriteStream('133.mp4'));
// ytdl('http://www.youtube.com/watch?v=kIbMYo7aO1s', {quality: '134',} )
//   .pipe(fs.createWriteStream('134.mp4'));
// ytdl('http://www.youtube.com/watch?v=kIbMYo7aO1s', {quality: '18',} )
//   .pipe(fs.createWriteStream('18.mp4'));



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/files', (req, res) => {
	var files = {
	  	music : []
	  };
	var music_files = fs.readdirSync('./downloads/music/');
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

app.post('/api/world', (req, res) => {
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.post}`,
  );
});

app.get('/api/lyrics', (req, res) => {
	if(req.query.file != null){
		var file_name = req.query.file;
		var data = fs.readFileSync('./downloads/lyrics/'+file_name, 'utf8'); 
		res.send(data);
	}
});

app.get('/api/music', (req, res) => {
	if(req.query.file != null){
		var file_name = req.query.file;
		var filePath = path.join(__dirname, '/downloads/music/'+file_name);
		var stat = fs.statSync(filePath);

		res.writeHead(200, {
	        'Content-Type': 'audio/mpeg',
	        'Content-Length': stat.size
	    });

	    var readStream = fs.createReadStream(filePath);
	    readStream.pipe(res);
	}else{
		res.send(
    'file is not specified.',
  );
	}
}).listen(2000);


app.listen(port, () => console.log(`Listening on port ${port}`));

