//--------------------------------------------------------------------------------
//ノート編集(メインページ) クラス
function MainPage() {
  this._userInfoData = null;
  this._userListUpdTimer = null;
  this._userInfoMap = null;
  this._peer = null;
  this._localStream = null;
  this._existingCall = null;

  this.ENUM_DISPLAY_CALLREADY = 0;
  this.ENUM_DISPLAY_CALLTALKING = 1;
}

MainPage.prototype = {
  init: function(userInfoData) {
    var _this = this;

    this._peer = new Peer(userInfoData["phoneId"],{
      key:   'b965b655-a8a7-4699-ac91-eb3792cc851d',
      debug: 3,
    });

    //SkyWay イベントハンドラ
    this._peer.on('open', () => {
      //シグナリングサーバ接続+準備完了時
      var id = _this._peer.id;
      _this.callReady();
    });
    this._peer.on('call', function(call){
      //通話着信時
      call.answer(this._localStream);
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

    // set up audio and video input selectors
    const audioSelect = $('#audioSource');
    const videoSelect = $('#videoSource');
    const selectors = [audioSelect, videoSelect];

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
                  'Microphone ' + (audioSelect.children().length + 1));
              audioSelect.append(option);
          } else if (deviceInfo.kind === 'videoinput') {
              option.text(deviceInfo.label ||
                  'Camera ' + (videoSelect.children().length + 1));
              videoSelect.append(option);
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

    videoSelect.on('change', this.callReady());
    audioSelect.on('change', this.callReady());

    this._userInfoData = userInfoData;
    this.updateUserList(this);

    //定期的にユーザログイン中更新とユーザリスト取得
    //setIntervalの引数にthisを渡す。 (updateUserList内でthisにアクセスできないため)
    this._userListUpdTimer = setInterval(this.updateUserList.bind(undefined, this), 5000);
  },

  clear: function () {
    this._userInfoData = null;
    clearInterval(_userListUpdTimer);
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

    var _this = this;
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      $('#my-video').get(0).srcObject = stream;
      _this._localStream = stream;

      if (existingCall) {
          existingCall.replaceStream(stream);
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
    alert("startTalk!!!");

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


