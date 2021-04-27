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

const {google} = require('googleapis');
const api_keys = [process.env.API_KEY_1,process.env.API_KEY_2];

var tj_list;
var singking_list;
var timestamp = new Date();

function getApiKey(){
	const random = Math.floor(Math.random() * api_keys.length);
	const result = api_keys[random];
	return result;
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
		var url = req.query.url;
		res.writeHead(200, {
	        'Content-Type': 'video/mp4'
	    });
	    ytdl(url, {quality: '18',} ).pipe(res);
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
	if(tj_list && cur_date<max_date){
		chart = tj_list;
	}else{
		var url = 'http://www.tjmedia.co.kr/tjsong/song_monthPopular.asp';
		chart = await requestTJChart(url);
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

app.listen(port, () => console.log(`Listening on port ${port}`));

