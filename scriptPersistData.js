//--------------------------------------------------------------------------------
//永続化 クラス
function PersistData() {
  
  //Kii Cloud 初期化
  Kii.initializeWithSite("thpnhw2r2l43", "b76e5763d645426397b15299a3728425", KiiSite.JP);

}

PersistData.prototype = {
  login: function (username, password, callback) {
    // Authenticate the user asynchronously.
    KiiUser.authenticate(username, password, {
      // If the user was authenticated
      success: function(theUser) {
        //console.log("User authenticated: " + JSON.stringify(theUser));
        // Go to the main screen.
        callback(true, "", username);
      },
      // If the user was not authenticated
      failure: function(theUser, errorString) {
        console.log("Unable to authenticate user: " + errorString);
        callback(false, errorString, username);
      }
    });
  },
  
  registUser: function (username, password, callback) {
    // Create a KiiUser object.
    var user = KiiUser.userWithUsername(username, password);
    // Register the user asynchronously.
    user.register({
        // If the user was registered
        success: function(theUser) {
          //console.log("User registered: " + JSON.stringify(theUser));

          // Go to the main screen.
          callback(true, "", username);
        },
        // If the user was not registered
        failure: function(theUser, errorString) {
          alert("Unable to register user: " + errorString);
          callback(false, errorString, username);
        }
    });
  },

  //アプリケーションスコープにユーザ情報保存
  //ユーザ名、ログオン中時間、通話用ID
  createUserInfo: function(username, timeString, phoneId, callback){
    var bucket = Kii.bucketWithName("myBucket");
    var kiiObj = bucket.createObject();

    kiiObj.set("type", "userInfo");
    kiiObj.set("user", username);
    kiiObj.set("loggedinTime", timeString);
    kiiObj.set("phoneId", phoneId);

    // Save the KiiObject.
    kiiObj.save({
      success: function(theObject) {
        var userInfoData = 
        {id: theObject.getID(),
         uri: theObject.objectURI(),
         user: theObject.get("user"),
         loggedinTime: theObject.get("loggedinTime"),
         phoneId: theObject.get("phoneId"),
        }
        callback(true, "", userInfoData);
      },
      failure: function(theObject, errorString) {
        callback(false, errorString, null);
      }
    });
  },

  //アプリケーションスコープにログイン中時間を保存
  updateLoggdinTime: function(objId, timeString){
    var bucket = Kii.bucketWithName("myBucket");
    var kiiObj = bucket.createObjectWithID(objId);
    kiiObj.set("loggedinTime", timeString);
    kiiObj.save({
      success: function(theObject) {
        console.log("Save succeeded");
      },
      failure: function(theObject, errorString) {
        alert("Unable to update object: " + errorString);
        console.log("Unable to update object: " + errorString);
      }
    });
  },

  //アプリケーションスコープのユーザ情報取得
  getUserInfo: function(username, callback){
    var bucket = Kii.bucketWithName("myBucket");
    var clause1 = KiiClause.equals("type", "userInfo");
    var clause2 = KiiClause.equals("user", username);
    var totalClause = KiiClause.and(clause1, clause2);

    var query = KiiQuery.queryWithClause(totalClause);

    // Define how to output the query result.
    query.setLimit(1);

    // Query KiiObjects.
    bucket.executeQuery(query, {
      success: function(queryPerformed, resultSet, nextQuery) {
        // Do something with the result.
        if(1<=resultSet.length){
          if(1<resultSet.length){
            console.log("getUserInfo Warn: " + username + " InfoLength = " + resultSet.length);
          }
          var kiiObj =  resultSet[0];
          var loadData = 
            {id: kiiObj.getID(),
             uri: kiiObj.objectURI(),
             user: kiiObj.get("user"),
             loggedinTime: kiiObj.get("loggedinTime"),
             phoneId: kiiObj.get("phoneId"),
            }
          callback(true, "", loadData);
        }
        else{
          callback(false, "ユーザーデータがありません。", null);
        }
      },
      failure: function(queryPerformed, errorString) {
        callback(false, errorString, null);
        // Handle the error.
      }
    });
  },

  getUserInfoList: function (callback) {
    var bucket = Kii.bucketWithName("myBucket");
    var clause = KiiClause.equals("type", "userInfo");
    var query = KiiQuery.queryWithClause(clause);

    // Define how to output the query result.
    query.setLimit(100);
    query.sortByDesc("user");

    // Query KiiObjects.
    bucket.executeQuery(query, {
      success: function(queryPerformed, resultSet, nextQuery) {
        var userInfoMap = new Map();
        // Do something with the result.
        for (var i=0; i<resultSet.length; i++) {
          // Do something with the KiiObject at resultSet[i].
          var kiiObj =  resultSet[i];
          var loadData = 
            {id: kiiObj.getID(),
             uri: kiiObj.objectURI(),
             user: kiiObj.get("user"),
             loggedinTime: kiiObj.get("loggedinTime"),
             phoneId: kiiObj.get("phoneId"),
            }
          userInfoMap.set(kiiObj.get("user"), loadData);
        }
        callback(true, "", userInfoMap);

        //_this._query = nextQuery;
      },
      failure: function(queryPerformed, errorString) {
        // Handle the error.
        callback(false, errorString, null);
      }
    });
  },

}

