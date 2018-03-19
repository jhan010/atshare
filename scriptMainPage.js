//--------------------------------------------------------------------------------
//ノート編集(メインページ) クラス
function MainPage() {
  //永続化用データ
  var _userInfoData = null;
  var _userListUpdTimer = null;
  var _userInfoMap = null;
  var _peer = null;
  var _localStream = null;
  var _existingCall = null;
}

MainPage.prototype = {
  init: function(userInfoData) {
    this._peer = new Peer({
      id:    userInfoData["phoneId"],
      key:   'b965b655-a8a7-4699-ac91-eb3792cc851d',
      debug: 3,
    });

    //SkyWay イベントハンドラ
    this._peer.on('open', () => {
      //シグナリングサーバ接続+準備完了時
      var id = this._peer.id;
    });
    this._peer.on('call', function(call){
      //通話着信時
      call.answer(this._localStream);
      startTalk(call);
    });
    this._peer.on('error', function(err){
      //エラー発生時
      var errMessage = "エラー発生: " + err.message;
      alert(errMessage);
    });
    this._peer.on('close', function(){
      //相手との切断時
      alert("通話終了");
    });
    this._peer.on('disconnected', function(){
      //シグナリングサーバとの切断時
      alert("シグナリングサーバと切断しました");
    });

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
                <a href="http://www.jquery2dotnet.com"><span class="glyphicon glyphicon-earphone"></span></a> \
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

  callToUser: function(userId){

  },

  startTalk: function(call) {
    // Hang up on an existing call if present
    if (this._existingCall) {
      this._existingCall.close();
    }
    // Wait for stream on the call, then set peer video display
    call.on('stream', stream => {
        $('#their-video').get(0).srcObject = stream;
    });
  }

}


