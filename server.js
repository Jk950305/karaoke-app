const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');

//soap request (Alsong Lyrics)
/*
const util = require('util')
const soapRequest = require('easy-soap-request');
const url = 'http://lyrics.alsong.co.kr/alsongwebservice/service1.asmx';
const sampleHeaders = {
  'Content-Type': 'application/soap+xml;charset=utf-8',
};
const xml = fs.readFileSync('lyricsEnvelope.xml', 'utf-8');
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

