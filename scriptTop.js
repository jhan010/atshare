
jQuery(function($){
});

$(document).ready(function () {

  mainPage = null;
  persistIF = new PersistData();
  
  ENUM_DISPLAY = {
    LOGIN : 0,
    MAIN : 1,
   };

  /*タッチデバイスだけボタン系コントロールにホバー効果*/
  $('a, input[type="button"], input[type="submit"], button, .touch-hover')
    .on('touchstart', function(){
      $(this).addClass('hover');
  }).on('touchend', function(){
      $(this).removeClass('hover');
  });

});

//--------------------------------------------------------------------------------
//ログイン、ユーザー登録
function performLogIn() {
  var username = document.getElementById("username-field").value;
  var password = document.getElementById("password-field").value;

  persistIF.login(username, password, function(result, errString, username){
    if(result == true){
      persistIF.getUserInfo(username, function(result, errString, userInfoData){
        if(result == true){
            openMainPage(userInfoData);
        }
        else{
          //登録されていないなら再登録
          createUserInfo_OpenMainPage(username);
        }
      });
    }
    else{
      alert(errString);
    }
  });
}

function performSignUp() {
  var username = document.getElementById("username-field").value;
  var password = document.getElementById("password-field").value;

  persistIF.registUser(username, password, function(result, errString, username){
    if(result == true){
      createUserInfo_OpenMainPage(username);
    }
    else{
      alert(errString);
    }
  });
}

function createUserInfo_OpenMainPage(username){
  var timeString = getDateString();
  var phoneId = username + '_phoneid_' + timeString;
  persistIF.createUserInfo(username, timeString, phoneId, function (result, errString, userInfoData) {
    if(result == true){
      openMainPage(userInfoData);
    }
    else{
      alert(errString);
    }
  });
}

//--------------------------------------------------------------------------------
//メインページ表示
function openMainPage(userInfoData) {
  displayControl(ENUM_DISPLAY.MAIN);

  document.getElementById("username-field").value = "";
  document.getElementById("password-field").value = "";

  if(!mainPage) {
    mainPage = new MainPage();
  }
  mainPage.init(userInfoData);

}

//--------------------------------------------------------------------------------
//メインページ用
function callToUser(userId) {
  mainPage.callToUser(userId);
}

//--------------------------------------------------------------------------------
//ログアウト
function performLogOut() {
  displayControl(ENUM_DISPLAY.LOGIN);

  document.getElementById("username-field").value = "";
  document.getElementById("password-field").value = "";

  if(mainPage) {
    mainPage.clear();
  }
}

//--------------------------------------------------------------------------------
//ホームページ表示
function dispHomePage() {
  displayControl(ENUM_DISPLAY.MAIN);

}

function displayControl(displayType) {

  document.getElementById("login-page").style.display = "none";
  document.getElementById("main-page").style.display = "none";
  document.getElementById("header-toppage").style.display = "none";


  switch(displayType) {
    case ENUM_DISPLAY.LOGIN:
      document.getElementById("login-page").style.display = "block";
      break;
    case ENUM_DISPLAY.MAIN:
      document.getElementById("main-page").style.display = "block";
      break;
  }

}
