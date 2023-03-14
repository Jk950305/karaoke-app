# Infinite Coin Karaoke

  Sing your favourite songs with altered pitch and tempo, right on your mobile and desktop. 
  URL: https://infinite-coin-karaoke.onrender.com/
  (please allow up to 15 seconds to load the heroku app)


## WHY?

  After COVID-19 hit, Karaoke places are all closed but there are alternative way to have karaoke on our hands. On YouTube, there are tons of Karaoke version of songs with fixed pitch and tempo. However, we are not professional singers and cannot even reach that high pitch like Ariana Grande. Also, some of us want to tweak the tempo so we can sing a song faster or slower. Karaoke places have their own karaoke machine that has tons of songs and ability to change pitch and tempo manually but we cannot go there anymore at least until COVID-19 ends. 

  It would be the best if we can afford karaoke machine by ourselves; however, it costs hundreds of dollars and it needs to be manually updated once there are new songs released. Thus, I decided to make my own karaoke player which can be accessed from mobile devices, laptop, and tablet PC.



## HOW?

  Front-end is written in React.js that handles all user interactions and back-end is written in Express.js. There are three core API's used in this web application: Google YouTube Data API, YouTube Downloader(YTDL), and Web Audio API. 

  Google YouTube Data API supports searching videos by title and retrieving video information in json format. YouTube Downloader(YTDL) in Node.js supports streaming and piping YouTube videos. Web Audio API supports adjusting pitch and tempo together but I found soundtouch.js library that individually adjusts pitch and tempo.
