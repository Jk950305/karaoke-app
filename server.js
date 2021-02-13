const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

const path = require('path');
const {join} = require('path');
const fs = require('fs');

const ytdl = require('ytdl-core');

var cheerio = require('cheerio');
var request = require('request');

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

app.use(express.static(path.join(__dirname, 'client/build')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//get api_key from text file

app.get('/api/api_key', (req, res) => {
	//const data = fs.readFileSync('./youtube_api_key.txt', {encoding:'utf8', flag:'r'});
	const data = process.env.YOUTUBE_API_KEY;
	res.send({ api_key: data });
 });

// app.get('/api/api_key', (req, res) => {
//   res.send({ api_key: 'AIzaSyDFKwmhFGxp0zBK3ddDmFOX9N65G_3F23k' });
// });


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


// app.get('/api/TJ_temp', async function (req, res) {
// 	var chart;
// 	var max_date = new Date(timestamp);
// 	max_date.setDate(timestamp.getDate()+1);
// 	var cur_date = new Date();
// 	if(popular_list && cur_date<max_date){
// 		chart = popular_list;
// 	}else{
// 		var url = 'http://www.tjmedia.co.kr/tjsong/song_monthPopular.asp';
// 		chart = await requestTJChart(url);
// 		popular_list = chart;
// 		timestamp = new Date();
// 	}
// 	res.contentType('application/json');
// 	res.send(JSON.stringify(chart));
// });

 app.get('/api/TJ', async function (req, res) {
	var chart;
	var url = 'http://www.tjmedia.co.kr/tjsong/song_monthPopular.asp';
	chart = await requestTJChart(url);
	res.contentType('application/json');
	res.send(JSON.stringify(chart));
});

app.listen(port, () => console.log(`Listening on port ${port}`));

