// Copyright 2016 Eyevinn Technology. All rights reserved
// Use of this source code is governed by a MIT License
// license that can be found in the LICENSE file.
// Author: Jonas Birme (Eyevinn Technology)
var activeViewPort;
var shakaPlayers = {};

function initHlsPlayer(conf, videoelemid, donecb) {
  var hlsconfig = {
    capLevelToPlayerSize: true
  };
  var hls = new Hls(hlsconfig);
  var videoelem = document.getElementById(videoelemid);
  hls.attachMedia(videoelem);
  hls.on(Hls.Events.MEDIA_ATTACHED, function() {
    hls.loadSource(conf.manifest);
    hls.on(Hls.Events.MANIFEST_PARSED, function(ev, data) {
      videoelem.muted = true;
      videoelem.play();
      donecb(videoelem);
    });
  });
  hls.on(Hls.Events.ERROR, function (event, data) {
    if (data.fatal) {
      switch(data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
      // try to recover network error
        console.log("fatal network error encountered, try to recover");
        hls.startLoad();
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.log("fatal media error encountered, try to recover");
        hls.recoverMediaError();
        break;
      default:
        // cannot recover
        hls.destroy();
        break;
      }
    }
  });
  hls.on(Hls.Events.LEVEL_SWITCH, function(event, data) {
    var level = hls.levels[data.level];
    var metaelem = document.getElementById(hls.media.id + '-meta');
    metaelem.innerHTML = (level.bitrate / 1000).toFixed(0) + 'kbps';
  });
}

function initDashPlayer(conf, videoelemid, donecb) {
  var videoelem;
  var shakap;

  videoelem = document.getElementById(videoelemid);
  shakap = new shaka.Player(videoelem);
  console.log(`initDash Player ${videoelem}`);
  shakaPlayers[videoelemid] = shakap;
  videoelem.addEventListener('progress', function(ev) {
    if (shakaPlayers[ev.target.id]) {
      var p = shakaPlayers[ev.target.id];
      var stats = p.getStats();
      //var metaelem = document.getElementById(ev.target.id + '-meta');
      //metaelem.innerHTML = (stats.streamBandwidth / 1000).toFixed(0) + 'kbps';
    }
  });

  console.log(conf.manifest);

  shakap.load(conf.manifest).then(function(ev) {
    videoelem.muted = true;
    shakap.setMaxHardwareResolution(600, 600);
    videoelem.play();
    donecb(videoelem);
    console.log(`${conf.manifest} play()`)
  }).catch(function(e) { console.log("Error: ", e); });
}

function initPlayer(conf, videoelemid, donecb) {
  if (conf.type === 'hls') {
    initHlsPlayer(conf, videoelemid, donecb);
  } else if (conf.type === 'dash') {
    initDashPlayer(conf, videoelemid, donecb);
  }
}

function onVideoClick(ev) {
  activateViewPort(ev.target.id);
}

function onWaiting(ev) {
  ev.target.className +=" video-buffering";
}

function onPlaying(ev) {
  ev.target.className = ev.target.className.replace("video-buffering", "");
//  ev.target.className = ev.target.className.replace("audio-buffering", "");
}

function initViewPort(conf, videoelemid) {
  initPlayer(conf, videoelemid, function(videoelem) {
    //console.log(videoelemid + " loaded!");
    videoelem.addEventListener("click", onVideoClick);
    videoelem.addEventListener("waiting", onWaiting);
    videoelem.addEventListener("playing", onPlaying);
    //var titleelem = document.getElementById(videoelemid+'-title');
    //titleelem.innerHTML = conf.title;
  });
}

function initViewPortRow(row, numcols, config) {
  for (var i=0; i<numcols; i++) {
    videoelemid = "vp"+row+i;
    c = config['row'+row][i];
    if (c) {
      initViewPort(c, videoelemid);
    }
  }
}

function playCommonAudio(config) {
    conf = config["common"][0];
    console.dir(conf);
    audioelemid = "ap0";  // default id
    videoelem = document.getElementById(audioelemid);
    shakap = new shaka.Player(videoelem);
    console.log(`initDash for audio Player ${videoelem}`);
    shakap.load(conf.manifest).then(function(ev) {
      videoelem.muted = true;
      videoelem.play();
      videoelem.volume = 1;
      videoelem.muted = false;
      console.log(`${conf.manifest} play(vol ${videoelem.volume}) muted ${videoelem.muted}`);
    }).catch(function(e) { console.log("Error: ", e); });

    shakap.muted = false;
    shakap.volume = 1;
    videoelem.className += " audio-unmuted";
    videoelem.muted = false;

    console.log(`${videoelem.className} play(vol ${videoelem.volume}) muted ${videoelem.muted}`);

    console.dir(` video conf : ${videoelem.getConfiguration}`);

}

function initCommonAudio(config) {
  conf = config["common"][0];
  console.dir(conf);
  audioelemid = "va00";  // default id

    if (conf) {
      initPlayer(conf, audioelemid, function(audioelem) {
        console.log(audioelemid + " loaded!");
        audioelem.addEventListener("click", onVideoClick);
        audioelem.addEventListener("waiting", onWaiting);
        audioelem.addEventListener("playing", onPlaying);
        //var titleelem = document.getElementById(videoelemid+'-title');
        //titleelem.innerHTML = conf.title;
      });
    }
}

function activateViewPort(videoelemid) {
  if (activeViewPort) {
    console.log(`activeViewPort ${activeViewPort}`);
    currentActiveVideoElem = document.getElementById(activeViewPort);
    currentActiveVideoElem.className = currentActiveVideoElem.className.replace("video-unmuted", "");
    currentActiveVideoElem.muted = true;
  }
  if (activeViewPort != videoelemid) {
    console.log(`activeViewPort ${activeViewPort}`);

    newActiveVideoElem = document.getElementById(videoelemid);
    newActiveVideoElem.className += " video-unmuted";
    newActiveVideoElem.muted = false;
    activeViewPort = videoelemid;
  } else {
    activeViewPort = undefined;
  }
}

function togglePlayback(videoelem) {
  if (videoelem.paused) {

    console.log(`togglePlayback play ${videoelem}`);

    videoelem.play();
  } else {
    videoelem.pause();
  }
}

function togglePlaybackOnAllViewPorts() {
  for(var i=0; i<2; i++) {
    for(var j=0; j<4; j++) {
      var videoelem = document.getElementById('vp'+i+j);
      togglePlayback(videoelem);
      console.log(`togglePlaybackOnAllViewPorts ${videoelem}`);
    }
  }

  var audioelem = document.getElementById('va0');
  togglePlayback(audioelem);
  console.log(`togglePlaybackOnAudio ${audioelem}`);
  //togglePlayback(document.getElementById('vpleft')); 
  //togglePlayback(document.getElementById('vpright')); 
}

function initMultiView(config) {
  if (config) {
    shaka.polyfill.installAll();
    //initCommonAudio(config);
    playCommonAudio(config);
    /*
    initViewPortRow(0, 4, config);
    initViewPortRow(1, 4, config);
    initViewPortRow(2, 4, config);
    initViewPortRow(3, 4, config);
    */
    /*
    if(config['main'][0]) { 
      initViewPort(config['main'][0], 'vpleft');
    }
    if(config['main'][1]) { 
      initViewPort(config['main'][1], 'vpright');
    }
    */
  }
}

function onKeyPress(ev) {
  if (ev.keyCode == 32) {
    // space
    console.log('operator hit space');
    togglePlaybackOnAllViewPorts();
    ev.preventDefault();
    ev.stopPropagation();
  } else if (ev.keyCode == 102) {
    // f
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  } else if (ev.keyCode >= 49 && ev.keyCode <= 56) {
    // 1-8 
    var idx = ev.keyCode - 49;
    var row = 0;
    if (idx > 3) {
      idx -= 4;
      row = 1;
    }
    videoelemid = 'vp' + row + idx;
    activateViewPort(videoelemid);
    console.log(`activate vp ${videoelemid}`);
  }
}

function initKeyControls() {
  document.addEventListener("keypress", onKeyPress, false);
}
