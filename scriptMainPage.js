//--------------------------------------------------------------------------------
//ノート編集(メインページ) クラス
function MainPage() {
  this._userInfoData = null;
  this._userListUpdTimer = null;
  this._userInfoMap = null;
  this._peer = null;
  this._localStream = null;
  this._existingCall = null;
  this._audioSelect = null;
  this._videoSelect = null;
  this._autoStatsTimer = null;

  this.ENUM_DISPLAY_CALLREADY = 0;
  this.ENUM_DISPLAY_CALLTALKING = 1;
}

MainPage.prototype = {
  init: function(userInfoData) {

    this._peer = new Peer(userInfoData["phoneId"],{
      key:   'b965b655-a8a7-4699-ac91-eb3792cc851d',
      debug: 3,
    });

    //SkyWay イベントハンドラ
    var _this = this;
    this._peer.on('open', () => {
      //シグナリングサーバ接続+準備完了時
      var id = _this._peer.id;
      _this.callReady();
    });
    this._peer.on('call', function(call){
      if( ! $('#autoanswer').is(':checked') ) { 
        //通話着信時
        if (!window.confirm(call.peer + ' さんから呼出がありました。\n接続しますか？')) {
          call.close();
          return;
        }
      }
      call.answer(_this._localStream);
      _this.startTalk(call);
    });
    this._peer.on('error', function(err){
      //エラー発生時
      var errMessage = "エラー発生: " + err.message;
      alert(errMessage);
    });
    this._peer.on('disconnected', function(){
      //シグナリングサーバとの切断時
      alert("シグナリングサーバと切断しました");
    });

    //統計情報自動更新ボタン
    $('#autostats').change(function() {
      if( $('#autostats').is(':checked') ) { 
        _this._autoStatsTimer = setInterval(()=>{
          if(_this._existingCall){
            getRTCStats(_this._existingCall._negotiator._pc.getStats());
          }
        },1000); 
      }
      else{
        clearInterval(_this._autoStatsTimer);
      }
    });


    // set up audio and video input selectors
    this._audioSelect = $('#audioSource');
    this._videoSelect = $('#videoSource');
    const selectors = [this._audioSelect, this._videoSelect];

    navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
      const values = selectors.map(select => select.val() || '');
      selectors.forEach(select => {
        const children = select.children(':first');
        while (children.length) {
            select.remove(children);
        }
      });

      for (let i = 0; i !== deviceInfos.length; ++i) {
          const deviceInfo = deviceInfos[i];
          const option = $('<option>').val(deviceInfo.deviceId);

          if (deviceInfo.kind === 'audioinput') {
              option.text(deviceInfo.label ||
                  'Microphone ' + (this._audioSelect.children().length + 1));
                this._audioSelect.append(option);
          } else if (deviceInfo.kind === 'videoinput') {
              option.text(deviceInfo.label ||
                  'Camera ' + (this._videoSelect.children().length + 1));
                this._videoSelect.append(option);
          }
      }

      selectors.forEach((select, selectorIndex) => {
          if (Array.prototype.slice.call(select.children()).some(n => {
              return n.value === values[selectorIndex];
          })) {
              select.val(values[selectorIndex]);
          }
      });
    });

    this._audioSelect.on('change', testCallReady);
    this._videoSelect.on('change', testCallReady);

    this._userInfoData = userInfoData;
    this.updateUserList(this);

    //定期的にユーザログイン中更新とユーザリスト取得
    //setIntervalの引数にthisを渡す。 (updateUserList内でthisにアクセスできないため)
    this._userListUpdTimer = setInterval(this.updateUserList.bind(undefined, this), 5000);
  },

  clear: function () {
    this._userInfoData = null;
    clearInterval(this._userListUpdTimer);
    clearInterval(this._autoStatsTimer);
  },

  updateUserList: function(classObj){
    var timeString = getDateString();
    persistIF.updateLoggdinTime(classObj._userInfoData["id"], timeString);
    persistIF.getUserInfoList(function(result, errString, getMapData){
      if(true == result){ 
        var parentObj = document.getElementById("phone-user-list");
        //ユーザーリストを一旦全削除
        while (parentObj.firstChild) parentObj.removeChild(parentObj.firstChild);
        //新しいユーザーリストを作成
        getMapData.forEach(function(value, key){
          if(value["user"] == classObj._userInfoData["user"]){
            return; //continueの意味
          }
          var timeNowString = getDateString();
          var timeLag = Math.abs(Number(timeNowString) - Number(value["loggedinTime"]));

          var addObj = $('');
          if(60000 > timeLag)
          {
            var addObj = $(' \
            <li class="list-group-item"><span class="glyphicon glyphicon-ok-circle icon-color-ok"></span>'
              + value["user"] +
              '<div class="pull-right"> \
                <a href="javascript:callToUser(\'' + value["user"] + '\')"><span class="glyphicon glyphicon-earphone"></span></a> \
              </div> \
            </li>').get(0);
          }
          else{
            addObj = $(' \
            <li class="list-group-item"><span class="glyphicon glyphicon-minus-sign icon-color-ng"></span>'
              + value["user"] +
              '<div class="pull-right"> \
              </div> \
            </li>').get(0);
          }

          var parentObj = document.getElementById("phone-user-list");
          parentObj.appendChild(addObj);
        });
        classObj._userInfoMap = getMapData;
      }
      else{
        console.log("getUserInfoList Error: " + errString);
      }
    });
  },

  callReady: function(){
    // Get audio/video stream
    const audioSource = $('#audioSource').val();
    const videoSource = $('#videoSource').val();
    const constraints = {
        audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
        video: {deviceId: videoSource ? {exact: videoSource} : undefined},
    };

    //streamの停止
    if(this._localStream) {
      this._localStream.getTracks().forEach(track => {
          track.stop();
      });
    }

    var _this = this;
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      $('#my-video').get(0).srcObject = stream;
      _this._localStream = stream;

      if (_this._existingCall) {
        _this._existingCall.replaceStream(stream);
        return;
      }
    }).catch(err => {
        console.error(err);
    });
  },

  callToUser: function(username){
    var userInfoData = this._userInfoMap.get(username);
    const callTalking = this._peer.call(userInfoData["phoneId"], this._localStream);
    this.startTalk(callTalking);
  },

  startTalk: function(callTalking) {
    // Hang up on an existing call if present
    if (this._existingCall) {
      this._existingCall.close();
    }

    // Wait for stream on the call, then set peer video display
    callTalking.on('stream', stream => {
      $('#their-video').get(0).srcObject = stream;
    });

    this._existingCall = callTalking;
    //callTalking.on('close', this.displayControl(this.ENUM_DISPLAY_CALLREADY));
    callTalking.on('close', testClose);

    this.displayControl(this.ENUM_DISPLAY_CALLTALKING);
  },

  callStop: function() {
    this._existingCall.close();
    this.displayControl(this.ENUM_DISPLAY_CALLREADY);
    clearInterval(this._autoStatsTimer);
  },

  displayControl: function(displayType) {  

    switch(displayType) {
      case this.ENUM_DISPLAY_CALLREADY:
        document.getElementById("callstop").style.display = "none";
        break;
      case this.ENUM_DISPLAY_CALLTALKING:
        document.getElementById("callstop").style.display = "block";
        break;
    }
  
  },
  
}

function callToUser(username) {
  mainPage.callToUser(username);
}

function callStop() {
  mainPage.callStop();
}

function testCallReady() {
  mainPage.callReady();
}
function testClose() {
  mainPage.displayControl(mainPage.ENUM_DISPLAY_CALLREADY);
}

async function getRTCStats(statsObject){

  let trasportArray = [];
  let candidateArray = [];
  let candidatePairArray = [];
  let inboundRTPAudioStreamArray = [];
  let inboundRTPVideoStreamArray = [];
  let outboundRTPAudioStreamArray = [];
  let outboundRTPVideoStreamArray = [];
  let codecArray = [];
  let mediaStreamTrack_local_audioArray = [];
  let mediaStreamTrack_local_videoArray = [];
  let mediaStreamTrack_remote_audioArray = [];
  let mediaStreamTrack_remote_videoArray = [];
  let candidatePairId = '';
  let localCandidateId = '';
  let remoteCandidateId = '';
  let localCandidate = {};
  let remoteCandidate = {};
  let inboundAudioCodec = {};
  let inboundVideoCodec = {};
  let outboundAudioCode = {};
  let outboundVideoCode = {};

  let stats = await statsObject;
  stats.forEach(stat => {
      if(stat.id.indexOf('RTCTransport') !== -1){
          trasportArray.push(stat);
      }                
      if(stat.id.indexOf('RTCIceCandidatePair') !== -1){
          candidatePairArray.push(stat);
      }
      if(stat.id.indexOf('RTCIceCandidate_') !== -1){
          candidateArray.push(stat);
      }
      if(stat.id.indexOf('RTCInboundRTPAudioStream') !== -1){
          inboundRTPAudioStreamArray.push(stat);
      }
      if(stat.id.indexOf('RTCInboundRTPVideoStream') !== -1){
          inboundRTPVideoStreamArray.push(stat);
      }
      if(stat.id.indexOf('RTCOutboundRTPAudioStream') !== -1){
          outboundRTPAudioStreamArray.push(stat);
      }
      if(stat.id.indexOf('RTCOutboundRTPVideoStream') !== -1){
          outboundRTPVideoStreamArray.push(stat);
      }
      if(stat.id.indexOf('RTCMediaStreamTrack_local_audio') !== -1){
          mediaStreamTrack_local_audioArray.push(stat);
      }
      if(stat.id.indexOf('RTCMediaStreamTrack_local_video') !== -1){
          mediaStreamTrack_local_videoArray.push(stat);
      }
      if(stat.id.indexOf('RTCMediaStreamTrack_remote_audio') !== -1){
          mediaStreamTrack_remote_audioArray.push(stat);
      }
      if(stat.id.indexOf('RTCMediaStreamTrack_remote_video') !== -1){
          mediaStreamTrack_remote_videoArray.push(stat);
      }
      if(stat.id.indexOf('RTCCodec') !== -1){
          codecArray.push(stat);
      }
  });

  trasportArray.forEach(transport => {
      if(transport.dtlsState === 'connected'){
          candidatePairId = transport.selectedCandidatePairId;
      }
  });
  candidatePairArray.forEach(candidatePair => {
      if(candidatePair.state === 'succeeded' && candidatePair.id === candidatePairId){
          localCandidateId = candidatePair.localCandidateId;
          remoteCandidateId = candidatePair.remoteCandidateId;
      }
  });
  candidateArray.forEach(candidate => {
      if(candidate.id === localCandidateId){
          localCandidate = candidate;
      }
      if(candidate.id === remoteCandidateId){
          remoteCandidate = candidate;
      }
  });

  inboundRTPAudioStreamArray.forEach(inboundRTPAudioStream => {
      codecArray.forEach(codec => {
          if(inboundRTPAudioStream.codecId === codec.id){
              inboundAudioCodec = codec;
          }
      });
  });
  inboundRTPVideoStreamArray.forEach(inboundRTPVideoStream => {
      codecArray.forEach(codec => {
          if(inboundRTPVideoStream.codecId === codec.id){
              inboundVideoCodec = codec;
          }
      });
  });  
  outboundRTPAudioStreamArray.forEach(outboundRTPAudioStream => {
      codecArray.forEach(codec => {
          if(outboundRTPAudioStream.codecId === codec.id){
              outboundAudioCodec = codec;
          }
      });
  });      
  outboundRTPVideoStreamArray.forEach(outboundRTPVideo => {
      codecArray.forEach(codec => {
          if(outboundRTPVideo.codecId === codec.id){
              outboundVideoCodec = codec;
          }
      });
  });   

  $('#local-candidate').html(localCandidate.ip + ':' + localCandidate.port + '(' +localCandidate.protocol + ')' + '<BR>type:' + localCandidate.candidateType);
  $('#remote-candidate').html(remoteCandidate.ip + ':' + remoteCandidate.port + '(' +remoteCandidate.protocol + ')' + '<BR>type:' + remoteCandidate.candidateType);
  
  $('#inbound-codec').html(inboundVideoCodec.mimeType + '<BR>' + inboundAudioCodec.mimeType);
  $('#outbound-codec').html(outboundVideoCodec.mimeType + '<BR>' + outboundAudioCodec.mimeType)

  $('#inbound-audio').html('bytesReceived:' + inboundRTPAudioStreamArray[0].bytesReceived + '<BR>jitter:' + inboundRTPAudioStreamArray[0].jitter + '<BR>fractionLost:' + inboundRTPAudioStreamArray[0].fractionLost);
  $('#inbound-video').html('bytesReceived:' + inboundRTPVideoStreamArray[0].bytesReceived + '<BR>fractionLost:' + inboundRTPVideoStreamArray[0].fractionLost);
  
  $('#outbound-audio').html('bytesReceived:' + outboundRTPAudioStreamArray[0].bytesSent);
  $('#outbound-video').html('bytesReceived:' + outboundRTPVideoStreamArray[0].bytesSent);

  $('#local-audio-video').html('audioLevel:' + mediaStreamTrack_local_audioArray[0].audioLevel + '<BR>frameHeight:' + mediaStreamTrack_local_videoArray[0].frameHeight + '<BR>frameWidth:' + mediaStreamTrack_local_videoArray[0].frameWidth + '<BR>framesSent:' + mediaStreamTrack_local_videoArray[0].framesSent);
  $('#remote-audio-video').html('audioLevel:' + mediaStreamTrack_remote_audioArray[0].audioLevel + '<BR>frameHeight:' + mediaStreamTrack_local_videoArray[0].frameHeight + '<BR>frameWidth:' + mediaStreamTrack_remote_videoArray[0].frameWidth);

}

