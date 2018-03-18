
// 指定サイズへリサイズ(base64データを返す) オプション:回転補正.
function resizeImage(img, compressSize, orientationChange, mime_type) {
  //デフォルト引数
  if(orientationChange === undefined) orientationChange = false;
  if(mime_type === undefined) mime_type = 'image/jpeg';

  var exif = 0;
  if(orientationChange) {
    //Imageの回転補正を行う場合はExif情報取得
    var exif = img.exifdata.Orientation;
  }
  else {
    exif = 1;
  }

  var press = compressSize / Math.max(Math.max(img.width, img.height),compressSize);
  var width = img.width * press;
  var height = img.height * press;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');

  console.log('exif:'+exif);
  if(exif > 4) {
    canvas.width = height;
    canvas.height = width;
  }
  switch (exif) {
  case 1:
    break;
  case 2: // vertical flip
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    break;
  case 3: // 180 rotate left
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
    break;
  case 4: // horizontal flip
    ctx.translate(0, height);
    ctx.scale(1, -1);
    break;
  case 5: // vertical flip + 90 rotate right
    ctx.rotate(0.5 * Math.PI);
    ctx.scale(1, -1);
    break;
  case 6: // 90 rotate right
    ctx.rotate(0.5 * Math.PI);
    ctx.translate(0, -height);
    break;
  case 7: // horizontal flip + 90 rotate right
    ctx.rotate(0.5 * Math.PI);
    ctx.translate(width, -height);
    ctx.scale(-1, 1);
    break;
  case 8: // 90 rotate left
    ctx.rotate(-0.5 * Math.PI);
    ctx.translate(-width, 0);
    break;
  default:
      break;
  }
  ctx.drawImage(img, 0, 0, width, height);
  var url = canvas.toDataURL(mime_type);
  ctx = null;
  canvas = null;
  return url;
}
  
function ImageToBase64(img, mime_type) {
  if(mime_type === undefined) mime_type = 'image/jpeg'; //デフォルト引数

  // New Canvas
  var canvas = document.createElement('canvas');
  canvas.width  = img.width;
  canvas.height = img.height;
  // Draw Image
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  // To Base64
  return canvas.toDataURL(mime_type);
}

function Base64ToImage(base64img, callback) {
  var img = new Image();
  img.onload = function() {
      callback(img);
  };
  img.src = base64img;
}

//日時の数値文字列取得(オブジェクトのID用)
//1970年1月1日0時0分0秒(UTC)からの経過ミリ秒(ex.1250000151104)
function getDateString() {
  //サーバの日時取得
  var strURL = window.location.href;
  var result = jQuery.ajax({
    type : 'HEAD',
    url :  strURL,
    async: false
  }).getResponseHeader("Date");

  //サーバ日時が取れない場合はクライアント日時を返す
  var retDate = new Date(result);
  if(retDate == null || 0 == retDate.getTime()){
      retDate = new Date();
  }

  //return retDate.getTime().toString();
  return String(retDate.getTime());
}

//数値判定
function isNumber(value) {
  return typeof value === 'number' && isFinite(value);
}
