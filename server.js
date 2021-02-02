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
 



function getMelonTop10() {
	var url = 'http://www.melon.com/chart/';
var title = new Array(),
    artist = new Array(),
    up_date,
    up_time;
var rank = 10;  //10위까지 확인
 
 
request(url, function(error, response, html){
  if (!error) {
    var $ = cheerio.load(html);
 
   // 곡명 파싱
    for (var i = 0; i < rank; i++) {
      $('.ellipsis.rank01 > span > a').each(function(){
        var title_info = $(this);
        var title_info_text = title_info.text();
        title[i] = title_info_text;
        i++;
      })
    }
 
    // 아티스트명 파싱
    for (var i = 0; i < rank; i++) {
      $('.checkEllipsis').each(function(){
        var artist_info = $(this);
        var artist_info_text = artist_info.text();
        artist[i] = artist_info_text;
        i++;
      })
    }
 
    // 업데이트 날짜
    $('.year').each(function(){
      var date_info = $(this);
      var date_info_text = date_info.text();
      up_date = date_info_text;
    })
 
    // 업데이트 시간
    $('.hhmm > span').each(function(){
      var time_info = $(this);
      var time_info_text = time_info.text();
      up_time = time_info_text;
    })
 
    //xxxx년 xx월 xx일 오후/오전 xx시 format
    var up_date_arr = new Array();
    var up_date_arr = up_date.split('.');
    var up_time_arr = new Array();
    var up_time_arr = up_time.split(':');
    var newtime;
 
    // 오후 오전 삽입
    if (up_time_arr[0] >12) {
      up_time_arr[0] = up_time_arr[0] - 12
      newtime = "오후 "+up_time_arr[0];
    } else {
      newtime = "오전 " +up_time_arr[0];
    }
 
    // 콘솔창 출력
    console.log("< 멜론 차트 1 ~ "+rank+"위 >");
 
    // 순위 제목 - 아티스트명
    for (var i = 1; i < rank+1; i++) {
      console.log(i+ "위" + " " + title[i-1] + " - " + artist[i-1]);
    }
    // 업데이트 시간
    console.log("("+up_date_arr[0]+"년 "+up_date_arr[1]+"월 "+up_date_arr[2]+"일 "+newtime+"시에 업데이트됨)");
  }
});
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

//get search title and return list of searched video info
app.get('/api/youtubeSearch', async function (req, res) {
	if(req.query.title != null){
		var title = req.query.title;
		var list = await getSearchResultGoogle(title);
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
}).listen(2002);

// app.post('/api/world', (req, res) => {
//   console.log(req.body);
//   res.send(
//     `I received your POST request. This is what you sent me: ${req.body.post}`,
//   );
// });


app.listen(port, () => console.log(`Listening on port ${port}`));

