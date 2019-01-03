// Copyright 2016 Eyevinn Technology. All rights reserved
// Use of this source code is governed by a MIT License
// license that can be found in the LICENSE file.
// Author: Jonas Birme (Eyevinn Technology)
var activeViewPort = null;
var shakaPlayers = {};
var curZoom = 1;
var orgTableRectWidth = 0;
var orgTableRectHeight = 0;

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
    var offset = 0;
    /*
    if(videoelemid=="vp00") offset = 45;
    else if(videoelemid=="vp01") offset = 50;
    else if(videoelemid=="vp02") offset = 55;
    else if(videoelemid=="vp03") offset = 60;
    else if(videoelemid=="vp10") offset = 65;
    else if(videoelemid=="vp11") offset = 70;
    else if(videoelemid=="vp12") offset = 75;
    else if(videoelemid=="vp13") offset = 80;
    else if(videoelemid=="vp20") offset = 85;
    else if(videoelemid=="vp21") offset = 90;
    else if(videoelemid=="vp22") offset = 95;
    else if(videoelemid=="vp23") offset = 100;
    else if(videoelemid=="vp30") offset = 105;
    else if(videoelemid=="vp31") offset = 110;
    else if(videoelemid=="vp32") offset = 115;
    else if(videoelemid=="vp33") offset = 120;
    */

    shakap.load(conf.manifest).then(function(ev) {
      videoelem.muted = true;
      //shakap.currentTime = offset;
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
  var table =  document.getElementById("table");
  if(curZoom==1){
    table.style.left = "0px";
    table.style.top = "0px";
  } else {
    var extWidth = (orgTableRectWidth*curZoom)/2 - orgTableRectWidth/2;
    var extHeight = (orgTableRectHeight*curZoom)/2 - orgTableRectHeight/2;
    table.style.left = extWidth+"px";
    table.style.top = extHeight+"px";
  }
  if (activeViewPort) {
    currentActiveVideoElem = document.getElementById(activeViewPort);
    currentActiveVideoElem.className = currentActiveVideoElem.className.replace("video-unmuted", "");
    //currentActiveVideoElem.muted = true;
  }
  if (activeViewPort != videoelemid) {
    newActiveVideoElem = document.getElementById(videoelemid);
    newActiveVideoElem.className += " video-unmuted";
    //newActiveVideoElem.muted = false;
    activeViewPort = videoelemid;

    var itemRect = newActiveVideoElem.getBoundingClientRect();
    var itemWidth = (itemRect.right - itemRect.left);
    var itemHeight = (itemRect.bottom - itemRect.top);
    console.log("activateViewPort itemRect Top: " + itemRect.top + " Left: " + itemRect.left + " Width: " + itemWidth + " Height: " + itemHeight);

    var tableRect =  table.getBoundingClientRect();
    var tableWidth = (tableRect.right - tableRect.left);
    var tableHeight = (tableRect.bottom - tableRect.top);
    console.log("activateViewPort tableRect Top: " + tableRect.top + " Left: " + tableRect.left + " Width: " + tableWidth + " Height: " + tableHeight);

    var left = 0, top = 0;
    left = -(itemRect.left - (tableWidth/2-itemWidth/2));
    top = -(itemRect.top - (tableHeight/2-itemHeight/2));
    console.log("activateViewPort current Top: " + top + " Left: " + left );

    table.style.left = left + "px";
    table.style.top = top + "px";
  } else {
    activeViewPort = null;
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
  togglePlayback(document.getElementById('audio')); 
}

function initMultiView(config) {
  if (config) {
    shaka.polyfill.installAll();
    initViewPortRow(0, 4, config);
    initViewPortRow(1, 4, config);
    initViewPortRow(2, 4, config);
    initViewPortRow(3, 4, config);

    if(config['main'][2]) { 
      initViewPort(config['main'][2], 'audio');
    }

    setTimeout(function(){    
      var table =  document.getElementById("table");
      var tableRect =  table.getBoundingClientRect();
      orgTableRectWidth = (tableRect.right - tableRect.left);
      orgTableRectHeight = (tableRect.bottom - tableRect.top);
      console.log("initMultiView tableRect Width: " + orgTableRectWidth + " Height: " + orgTableRectHeight);
    }, 300);
  }
}

function onKeyPress(ev) {
  console.log('event keyCode: '+ev.keyCode);
  if (ev.keyCode == 32) {
    // space
    console.log('operator hit space');
    togglePlaybackOnAllViewPorts();
    
    ev.preventDefault();
    //ev.pausePropagation();
  } else if (ev.keyCode == 43 || ev.keyCode == 61) { // _ (61), - (43)
    console.log('operator hit Zoom In');
    if(curZoom>5) return;
    curZoom += 0.5;

    var table =  document.getElementById("table");
    table.style.transform = "scale("+curZoom+")";
    console.log("onKeyPress tableRect Width: " + orgTableRectWidth + " Height: " + orgTableRectHeight);

    if(curZoom==1){
      table.style.left = "0px";
      table.style.top = "0px";
    } else {
      extWidth = (orgTableRectWidth*curZoom)/2 - orgTableRectWidth/2;
      extHeight = (orgTableRectHeight*curZoom)/2 - orgTableRectHeight/2;
      console.log("onKeyPress tableRect Width: " + extWidth + " Height: " + extHeight);

      table.style.left = extWidth+"px";
      table.style.top = extHeight+"px";
      console.log("onKeyPress curZoom: " + curZoom);
      console.log("onKeyPress tableRect Top: " + table.style.top + " Left: " + table.style.left);
    }  
    if (activeViewPort) {
      var oldActiveViewPort = activeViewPort;
      activateViewPort(activeViewPort);
      setTimeout(function(){
        activateViewPort(oldActiveViewPort);
      }, 300);
    }
  } else if (ev.keyCode == 95 || ev.keyCode == 45) { // = (95), + (45)
    console.log('operator hit Zoom Out');
    if(curZoom<=0.5) return;
    curZoom -= 0.5;

    var table =  document.getElementById("table");
    table.style.transform = "scale("+curZoom+")";
    console.log("onKeyPress tableRect Width: " + orgTableRectWidth + " Height: " + orgTableRectHeight);

    if(curZoom==1){
      table.style.left = "0px";
      table.style.top = "0px";
    } else if(curZoom<=1) {
      var tableRect =  table.getBoundingClientRect();
      var tableWidth = (tableRect.right - tableRect.left);
      var tableHeight = (tableRect.bottom - tableRect.top);
      console.log("activateViewPort tableRect Top: " + tableRect.top + " Left: " + tableRect.left + " Width: " + tableWidth + " Height: " + tableHeight);
  
      var extWidth = orgTableRectWidth/2 - tableWidth/2;
      var extHeight = orgTableRectHeight/2 - tableHeight/2;
      console.log("onKeyPress tableRect Width: " + extWidth + " Height: " + extHeight);

      table.style.left = extWidth+"px";
      table.style.top = extHeight+"px";
      console.log("onKeyPress curZoom: " + curZoom);
      console.log("onKeyPress tableRect Top: " + table.style.top + " Left: " + table.style.left);
    } else {
      extWidth = (orgTableRectWidth*curZoom)/2 - orgTableRectWidth/2;
      extHeight = (orgTableRectHeight*curZoom)/2 - orgTableRectHeight/2;
      console.log("onKeyPress tableRect Width: " + extWidth + " Height: " + extHeight);

      table.style.left = extWidth+"px";
      table.style.top = extHeight+"px";
      console.log("onKeyPress curZoom: " + curZoom);
      console.log("onKeyPress tableRect Top: " + table.style.top + " Left: " + table.style.left);
    }

    if (activeViewPort) {
      var oldActiveViewPort = activeViewPort;
      activateViewPort(activeViewPort);
      setTimeout(function(){
        activateViewPort(oldActiveViewPort);
      }, 300);
    }
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
    console.log("videoelemid: "+videoelemid);
    activateViewPort(videoelemid);
  }
}

function onResize(){
    var table =  document.getElementById("table");
    curZoom = 1;
    table.style.transform = "scale("+curZoom+")";
   
    setTimeout(function(){    
      var table =  document.getElementById("table");
      var tableRect =  table.getBoundingClientRect();
      orgTableRectWidth = (tableRect.right - tableRect.left);
      orgTableRectHeight = (tableRect.bottom - tableRect.top);
      console.log("initMultiView tableRect Width: " + orgTableRectWidth + " Height: " + orgTableRectHeight);

      if (activeViewPort) {
        var oldActiveViewPort = activeViewPort;
        activateViewPort(activeViewPort);
        setTimeout(function(){
          activateViewPort(oldActiveViewPort);
        }, 300);
      }
    }, 100);
}

function initKeyControls() {
  document.addEventListener("keypress", onKeyPress, false);
}

function initResize() {
  window.addEventListener("resize", onResize, false);
}