// Copyright 2016 Eyevinn Technology. All rights reserved
// Use of this source code is governed by a MIT License
// license that can be found in the LICENSE file.
// Author: Jonas Birme (Eyevinn Technology)
var activeViewPort = null;
var shakaPlayers = {};
var curZoom = 1;
var orgTableRectWidth = 0;
var orgTableRectHeight = 0;
var allTracks = {};
var motionVectorUrl = null;
var motionVectors = {};
var motionVectorMax = 0;
var motionVectorMin = 0;
var trackSelectOption = 1; // random = 1 (default), motionvector = 2
var curDisplayIndex = 0;
var vectorCretiras = [];
var highligtAreas=[];

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
    }).catch(function(e) { console.log("Error: ", e); });
  } else {
    shakap.configure({
      abr: {
        enabled: false
      },
      streaming: {
        bufferingGoal: 3
      }
    });

    shakap.load(conf.manifest).then(function(ev) {
      videoelem.muted = true;
      shakap.minimumUpdatePeriod="PT03S";
      shakap.setMaxHardwareResolution(600, 600);
      //videoelem.play();
      allTracks[videoelemid] = shakap.getVariantTracks();
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

  var maxlength = 0;
  if (activeViewPort) {
    currentActiveVideoElem = document.getElementById(activeViewPort);
    currentActiveVideoElem.className = currentActiveVideoElem.className.replace("video-unmuted", "");
    //currentActiveVideoElem.muted = true;
    maxlength = allTracks[activeViewPort].length - 1;
    shakaPlayers[activeViewPort].selectVariantTrack(allTracks[activeViewPort][maxlength], true);
    if(trackSelectOption==3 && activeViewPort == videoelemid) {
      for(var k=0; k<highligtAreas.length; k++) {
        var htempid = highligtAreas[k];
        console.log("htempid:",htempid);
        shakaPlayers[htempid].selectVariantTrack(allTracks[htempid][maxlength], false);
      }
    }
  }
  if (activeViewPort != videoelemid) {
    newActiveVideoElem = document.getElementById(videoelemid);
    newActiveVideoElem.className += " video-unmuted";
    //newActiveVideoElem.muted = false;
    activeViewPort = videoelemid;
    
    var itemRect = newActiveVideoElem.getBoundingClientRect();
    var itemWidth = (itemRect.right - itemRect.left);
    var itemHeight = (itemRect.bottom - itemRect.top);

    var tableRect =  table.getBoundingClientRect();
    var tableWidth = (tableRect.right - tableRect.left);
    var tableHeight = (tableRect.bottom - tableRect.top);

    var left = 0, top = 0;
    left = -(itemRect.left - (tableWidth/2-itemWidth/2));
    top = -(itemRect.top - (tableHeight/2-itemHeight/2));

    table.style.left = left + "px";
    table.style.top = top + "px";
 
    //if(trackSelectOption==3) {
      highligtAreas = [];
      if(videoelemid=="vp00"){
        highligtAreas.push("vp01");
        highligtAreas.push("vp10");
        highligtAreas.push("vp11");
      }
      else if(videoelemid=="vp01"){
        highligtAreas.push("vp00");
        highligtAreas.push("vp02");
        highligtAreas.push("vp10");
        highligtAreas.push("vp11");
        highligtAreas.push("vp12");
      }
      else if(videoelemid=="vp02"){
        highligtAreas.push("vp01");
        highligtAreas.push("vp03");
        highligtAreas.push("vp11");
        highligtAreas.push("vp12");
        highligtAreas.push("vp13");
      }
      else if(videoelemid=="vp03"){
        highligtAreas.push("vp02");
        highligtAreas.push("vp12");
        highligtAreas.push("vp13");
      }
      else if(videoelemid=="vp10"){
        highligtAreas.push("vp00");
        highligtAreas.push("vp01");
        highligtAreas.push("vp11");
        highligtAreas.push("vp20");
        highligtAreas.push("vp21");
      }
      else if(videoelemid=="vp11"){
        highligtAreas.push("vp00");
        highligtAreas.push("vp01");
        highligtAreas.push("vp02");
        highligtAreas.push("vp10");
        highligtAreas.push("vp12");
        highligtAreas.push("vp20");
        highligtAreas.push("vp21");
        highligtAreas.push("vp22");
      }
      else if(videoelemid=="vp12"){
        highligtAreas.push("vp01");
        highligtAreas.push("vp02");
        highligtAreas.push("vp03");
        highligtAreas.push("vp11");
        highligtAreas.push("vp13");
        highligtAreas.push("vp21");
        highligtAreas.push("vp22");
        highligtAreas.push("vp23");
      }
      else if(videoelemid=="vp13"){
        highligtAreas.push("vp02");
        highligtAreas.push("vp03");
        highligtAreas.push("vp12");
        highligtAreas.push("vp22");
        highligtAreas.push("vp23");
      }
      else if(videoelemid=="vp20"){
        highligtAreas.push("vp10");
        highligtAreas.push("vp11");
        highligtAreas.push("vp21");
        highligtAreas.push("vp30");
        highligtAreas.push("vp31");
      }
      else if(videoelemid=="vp21"){
        highligtAreas.push("vp10");
        highligtAreas.push("vp11");
        highligtAreas.push("vp12");
        highligtAreas.push("vp20");
        highligtAreas.push("vp22");
        highligtAreas.push("vp30");
        highligtAreas.push("vp31");
        highligtAreas.push("vp32");
      }
      else if(videoelemid=="vp22"){
        highligtAreas.push("vp11");
        highligtAreas.push("vp12");
        highligtAreas.push("vp13");
        highligtAreas.push("vp21");
        highligtAreas.push("vp23");
        highligtAreas.push("vp31");
        highligtAreas.push("vp32");
        highligtAreas.push("vp33");
      }
      else if(videoelemid=="vp23"){
        highligtAreas.push("vp12");
        highligtAreas.push("vp13");
        highligtAreas.push("vp22");
        highligtAreas.push("vp32");
        highligtAreas.push("vp33");
      }
      else if(videoelemid=="vp30"){
        highligtAreas.push("vp20");
        highligtAreas.push("vp21");
        highligtAreas.push("vp31");
      }
      else if(videoelemid=="vp31"){
        highligtAreas.push("vp20");
        highligtAreas.push("vp21");
        highligtAreas.push("vp22");
        highligtAreas.push("vp30");
        highligtAreas.push("vp32");
      }
      else if(videoelemid=="vp32"){
        highligtAreas.push("vp21");
        highligtAreas.push("vp22");
        highligtAreas.push("vp23");
        highligtAreas.push("vp31");
        highligtAreas.push("vp33");
      }
      else if(videoelemid=="vp33"){
        highligtAreas.push("vp22");
        highligtAreas.push("vp23");
        highligtAreas.push("vp32");
      }
      for(var i=0; i<4; i++) {
        for(var j=0; j<4; j++) {
          var tempid = "vp"+i+j;
          if(videoelemid==tempid){
            shakaPlayers[videoelemid].selectVariantTrack(allTracks[videoelemid][0], true);
            console.log("tempid:",tempid,0);
          }
          else if(highligtAreas.indexOf(tempid)>=0){
            shakaPlayers[tempid].selectVariantTrack(allTracks[tempid][1], false);
            console.log("tempid:",tempid,1);
          }
          else {
            maxlength = allTracks[tempid].length - 1;
            shakaPlayers[tempid].selectVariantTrack(allTracks[tempid][maxlength], false);
            console.log("tempid:",tempid,maxlength);
          }
        }
      } 
      trackSelectOption = 3;
    /*
    } else {
      shakaPlayers[videoelemid].selectVariantTrack(allTracks[videoelemid][0], true);
    }
    */
  } else {
    trackSelectOption = 1;
    activeViewPort = null;
  }
}

function togglePlayback(videoelemid, play) {
  var videoelem = document.getElementById(videoelemid);
  var playPromise;
  if (play) {
    if(videoelem.paused)
      playPromise = videoelem.play();
  } else {
    if(!videoelem.paused)
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
      
      togglePlayback('vp'+i+j);
    }
  }
  togglePlayback('audio'); 
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

    if(config['main'][3]){
      motionVectorUrl = config['main'][3].manifest;

      $.ajax({
        type : 'GET',
        url : motionVectorUrl,
        success : function (data) {
            var length = 0;
            try {
              length = data["0x0"].length;
            } catch(e){
              length = 0;
            }
            if(length== 0) return;
           
            var minValue = 0;
            var maxValue = 0;
            for(var k=0; k<length; k++){
              for(var i=0; i<4; i++) {
                  for(var j=0; j<4; j++) {
                      if(motionVectors["vp"+i+j]==null) motionVectors["vp"+i+j] = [];
                      motionVectors["vp"+i+j][k] = data[i+"x"+j][k];
                      if(i==0&&j==0&&k==0) {
                        minValue = data[i+"x"+j][k];
                        maxValue = data[i+"x"+j][k];
                      } else {
                        if(data[i+"x"+j][k] > 0 && minValue > data[i+"x"+j][k]) minValue = data[i+"x"+j][k];
                        if(data[i+"x"+j][k] > 0 && maxValue < data[i+"x"+j][k]) maxValue = data[i+"x"+j][k];
                      }
                  }
              }
            }
            motionVectorMin = minValue;
            motionVectorMax = maxValue;
        }
      });
    }

    setTimeout(function(){    
      var table =  document.getElementById("table");
      var tableRect =  table.getBoundingClientRect();
      orgTableRectWidth = (tableRect.right - tableRect.left);
      orgTableRectHeight = (tableRect.bottom - tableRect.top);
    }, 300);
  }
}

function onKeyPress(ev) {
  console.log('event keyCode: '+ev.keyCode);
  if (ev.keyCode == 32) {
    // space
    console.log('operator hit space');
    //togglePlaybackOnAllViewPorts();
    var audioelem = document.getElementById('audio');
    if(audioelem.paused){
      togglePlayback('audio', true); 
      audioPlay();
    } 
    else {
      togglePlayback('audio', false); 
      audioPause();
    } 
    ev.preventDefault();
    //ev.pausePropagation();
  } else if (ev.keyCode == 113) {
      // q
      console.log('operator hit q');
      trackSelectOption = 1;
  } else if (ev.keyCode == 119) {
      // w
      console.log('operator hit w');
      trackSelectOption = 2;
  } else if (ev.keyCode == 101) {
      // e
      console.log('operator hit e');
      trackSelectOption = 3;
  } else if (ev.keyCode == 43 || ev.keyCode == 61) { // _ (61), - (43)
    console.log('operator hit Zoom In');
    if(curZoom>5) return;
    curZoom += 0.5;

    var table =  document.getElementById("table");
    table.style.transform = "scale("+curZoom+")";

    if(curZoom==1){
      table.style.left = "0px";
      table.style.top = "0px";
    } else {
      extWidth = (orgTableRectWidth*curZoom)/2 - orgTableRectWidth/2;
      extHeight = (orgTableRectHeight*curZoom)/2 - orgTableRectHeight/2;

      table.style.left = extWidth+"px";
      table.style.top = extHeight+"px";
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

    if(curZoom==1){
      table.style.left = "0px";
      table.style.top = "0px";
    } else if(curZoom<=1) {
      var tableRect =  table.getBoundingClientRect();
      var tableWidth = (tableRect.right - tableRect.left);
      var tableHeight = (tableRect.bottom - tableRect.top);
  
      var extWidth = orgTableRectWidth/2 - tableWidth/2;
      var extHeight = orgTableRectHeight/2 - tableHeight/2;

      table.style.left = extWidth+"px";
      table.style.top = extHeight+"px";
    } else {
      extWidth = (orgTableRectWidth*curZoom)/2 - orgTableRectWidth/2;
      extHeight = (orgTableRectHeight*curZoom)/2 - orgTableRectHeight/2;

      table.style.left = extWidth+"px";
      table.style.top = extHeight+"px";
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

function initAudio() {
  var audioelem = document.getElementById('audio');
  audioelem.addEventListener("play", audioPlay, false);
  audioelem.addEventListener("pause", audioPause, false);
  audioelem.addEventListener("seeked", audioSeek, true);
}

function audioPlay(){
  for(var i=0; i<4; i++) {
    for(var j=0; j<4; j++) {
      var videoelem = document.getElementById('vp'+i+j);
      videoelem.className="video-active";      
      togglePlayback('vp'+i+j, true);
    }
  }
}

function audioPause(){
  for(var i=0; i<4; i++) {
    for(var j=0; j<4; j++) {
      var videoelem = document.getElementById('vp'+i+j);
      videoelem.className="video-pause";
      togglePlayback('vp'+i+j, false);
      videoelem.currentTime = this.currentTime;
    }
  }
}

function audioSeek(ev){
  console.log("onseeked");
  for(var i=0; i<4; i++) {
    for(var j=0; j<4; j++) {
      var videoelem = document.getElementById('vp'+i+j);
      videoelem.currentTime = this.currentTime;
    }
  }
}