const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/hello', (req, res) => {
  res.send({ express: 'Hello From Express' });
});

app.get('/api/files', (req, res) => {
	fs.readdir('./downloads/music/', (err, files) => {
	  var result = [];
	  files.forEach(file => {
	    result.push({filename: file});
	  });
	  console.log(result);
	  res.contentType('application/json');
	  res.send(JSON.stringify(result));
	});
});

app.post('/api/world', (req, res) => {
  console.log(req.body);
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.post}`,
  );
});

app.get('/api/mp3', (req, res) => {
	var file_name = req.query.file;
	var filePath = path.join(__dirname, '/downloads/music/'+file_name);
	var stat = fs.statSync(filePath);

	res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    var readStream = fs.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);
}).listen(2000);

app.listen(port, () => console.log(`Listening on port ${port}`));

