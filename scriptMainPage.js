//--------------------------------------------------------------------------------
//ノート編集(メインページ) クラス
function MainPage() {
  //永続化用データ
  var _loginUser = null;
  var _userInfoPersistId = null;
  var _userListUpdTimer = null;
  var _userInfoMap = null;

}

MainPage.prototype = {
  init: function(loginUser, userInfoPersistId) {
    this._loginUser = loginUser;
    this._userInfoPersistId = userInfoPersistId;

    this.updateUserList(this);

    //定期的にユーザログイン中更新とユーザリスト取得
    //setIntervalの引数にthisを渡す。 (updateUserList内でthisにアクセスできないため)
    this._userListUpdTimer = setInterval(this.updateUserList.bind(undefined, this), 30000);
  },

  clear: function () {
    this._loginUser = null;
    this._userInfoPersistId = null;
    clearInterval(_userListUpdTimer);
  },

  updateUserList: function(classObj){
    var timeString = getDateString();
    persistIF.updateLoggdinTime(classObj._userInfoPersistId, timeString);
    persistIF.getUserInfoList(function(result, errString, getMapData){
      if(true == result){ 
        getMapData.forEach(function(value, key){
          if(value["user"] == classObj._loginUser){
            return; //continueの意味
          }
          var parentObj = document.getElementById("phone-user-list");
          var addObj = $(' \
            <li class="list-group-item"><span class="glyphicon glyphicon-ok-circle icon-color-ok"></span>'
              + value["user"] +
              '<div class="pull-right"> \
                <a href="http://www.jquery2dotnet.com"><span class="glyphicon glyphicon-earphone"></span></a> \
              </div> \
            </li>').get(0);
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

}


