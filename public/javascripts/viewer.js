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
  var videoelem = document.getElementById(videoelemid);
  var shakap = new shaka.Player(videoelem);
  shakaPlayers[videoelemid] = shakap;
  videoelem.addEventListener('progress', function(ev) {
    if (shakaPlayers[ev.target.id]) {
      var p = shakaPlayers[ev.target.id];
      var stats = p.getStats();
      //var metaelem = document.getElementById(ev.target.id + '-meta');
      //metaelem.innerHTML = (stats.streamBandwidth / 1000).toFixed(0) + 'kbps';
    }
  });

  if(videoelemid=="audio"){
    shakap.load(conf.manifest).then(function(ev) {
      //videoelem.muted = true;
      //shakap.setMaxHardwareResolution(600, 600);
      //videoelem.play();
      //donecb(videoelem);
    }).catch(function(e) { console.log("Error: ", e); });
  } else {
    shakap.load(conf.manifest).then(function(ev) {
      videoelem.muted = true;
      shakap.setMaxHardwareResolution(600, 600);
      //videoelem.play();
      donecb(videoelem);
    }).catch(function(e) { console.log("Error: ", e); });
  }
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

function activateViewPort(videoelemid) {
  if (activeViewPort) {
    currentActiveVideoElem = document.getElementById(activeViewPort);
    currentActiveVideoElem.className = currentActiveVideoElem.className.replace("video-unmuted", "");
    currentActiveVideoElem.muted = true;
  }
  if (activeViewPort != videoelemid) {
    newActiveVideoElem = document.getElementById(videoelemid);
    newActiveVideoElem.className += " video-unmuted";
    newActiveVideoElem.muted = false;
    
    activeViewPort = videoelemid;
  } else {
    activeViewPort = undefined;
  }
}

function togglePlayback(videoelem) {
  var playPromise;
  if (videoelem.paused) {
    playPromise = videoelem.play();
  } else {
    playPromise = videoelem.pause();
  }

  if (playPromise !== undefined) {
    playPromise.then(_ => {
      console.log("playing is sucess!");
    })
    .catch(error => {
      console.log("playing is fail!"+ error);
    });
  }
}

function togglePlaybackOnAllViewPorts() {
  for(var i=0; i<4; i++) {
    for(var j=0; j<4; j++) {
      var videoelem = document.getElementById('vp'+i+j);
      console.log("vp"+i+j+" loaded!");
      videoelem.className="video-active";
      togglePlayback(videoelem);
    }
  }
  //togglePlayback(document.getElementById('vpleft')); 
  //togglePlayback(document.getElementById('vpright')); 
  togglePlayback(document.getElementById('audio')); 
}

function togglePlaybackOnCenterViewPorts() {
  for(var i=1; i<3; i++) {
    for(var j=1; j<3; j++) {
      var videoelem = document.getElementById('vp'+i+j);
      console.log("vp"+i+j+" loaded!");
      videoelem.className="video-active";
      togglePlayback(videoelem);
    }
  }
  //togglePlayback(document.getElementById('vpleft')); 
  //togglePlayback(document.getElementById('vpright')); 
  togglePlayback(document.getElementById('audio')); 
}

function initMultiView(config) {
  if (config) {
    shaka.polyfill.installAll();
    initViewPortRow(0, 4, config);
    initViewPortRow(1, 4, config);
    initViewPortRow(2, 4, config);
    initViewPortRow(3, 4, config);

    /*
    if(config['main'][0]) { 
      initViewPort(config['main'][0], 'vpleft');
    }
    if(config['main'][1]) { 
      initViewPort(config['main'][1], 'vpright');
    }
    */
    if(config['main'][2]) { 
      initViewPort(config['main'][2], 'audio');
    }
  }
}

function onKeyPress(ev) {
  if (ev.keyCode == 32) {
    // space
    console.log('operator hit space');
  
    if(window.innerWidth < 1920){
      togglePlaybackOnCenterViewPorts();
      initScrollControls();
    } else {
      togglePlaybackOnAllViewPorts();
    } 
    
    ev.preventDefault();
    //ev.pausePropagation();
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
  }
}

function onScroll(ev) {
  var top = this.scrollY, left = this.scrollX;
  console.log('Scroll X: ' + left + 'px');
  console.log('Scroll Y: ' + top + 'px');

  var videoelem = null;
  if(top>135){
    videoelem = document.getElementById('vp00');
    videoelem.className="video-paused";
    videoelem = document.getElementById('vp01');
    videoelem.className="video-paused";
    videoelem = document.getElementById('vp02');
    videoelem.className="video-paused";
    videoelem = document.getElementById('vp03');
    videoelem.className="video-paused";
  } else {
    videoelem = document.getElementById('vp00');
    videoelem.className="video-active";
    videoelem = document.getElementById('vp01');
    videoelem.className="video-active";
    videoelem = document.getElementById('vp02');
    videoelem.className="video-active";
    videoelem = document.getElementById('vp03');
    videoelem.className="video-active";
  }

  if(top+window.innerHeight > 1080){
    videoelem = document.getElementById('vp30');
    videoelem.className="video-active";
    videoelem = document.getElementById('vp31');
    videoelem.className="video-active";
    videoelem = document.getElementById('vp32');
    videoelem.className="video-active";
    videoelem = document.getElementById('vp33');
    videoelem.className="video-active";
  } else {
    videoelem = document.getElementById('vp30');
    videoelem.className="video-paused";
    videoelem = document.getElementById('vp31');
    videoelem.className="video-paused";
    videoelem = document.getElementById('vp32');
    videoelem.className="video-paused";
    videoelem = document.getElementById('vp33');
    videoelem.className="video-paused";
  }

  if(left>240){
    //videoelem = document.getElementById('vp00');
    //videoelem.className="video-paused";
    videoelem = document.getElementById('vp10');
    videoelem.className="video-paused";
    videoelem = document.getElementById('vp20');
    videoelem.className="video-paused";
    //videoelem = document.getElementById('vp30');
    //videoelem.className="video-paused";
  } else {
    //videoelem = document.getElementById('vp00');
    //videoelem.className="video-active";
    videoelem = document.getElementById('vp10');
    videoelem.className="video-active";
    videoelem = document.getElementById('vp20');
    videoelem.className="video-active";
    //videoelem = document.getElementById('vp30');
    //videoelem.className="video-active";
  }

  if(left+window.innerWidth> 1920){
    //videoelem = document.getElementById('vp03');
    //videoelem.className="video-active";
    videoelem = document.getElementById('vp13');
    videoelem.className="video-active";
    videoelem = document.getElementById('vp23');
    videoelem.className="video-active";
    //videoelem = document.getElementById('vp33');
    //videoelem.className="video-active";
  } else {
    //videoelem = document.getElementById('vp03');
    //videoelem.className="video-paused";
    videoelem = document.getElementById('vp13');
    videoelem.className="video-paused";
    videoelem = document.getElementById('vp23');
    videoelem.className="video-paused";
    //videoelem = document.getElementById('vp33');
    //videoelem.className="video-paused";
  }

}

function initKeyControls() {
  document.addEventListener("keypress", onKeyPress, false);
}

function initScrollControls() {
  window.addEventListener("scroll", onScroll, false);
}