var imgArray;
var currentMsg;

// Function to send a message to the Pebble using AppMessage API
// We are currently only sending a message using the "status" appKey defined in appinfo.json/Settings
function sendMessage() {
	Pebble.sendAppMessage({"status": 1}, messageSuccessHandler, messageFailureHandler);
}

// Called when the message send attempt succeeds
function messageSuccessHandler() {
  console.log("Message send succeeded.");  
}

// Called when the message send attempt fails
function messageFailureHandler() {
  console.log("Message send failed.");
  //sendMessage();
  messageAction(currentMsg);
}

var xhrRequest = function (url, type, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(this.responseText);
  };
  xhr.open(type, url);
  xhr.send();
};

function getImage(){
  xhrRequest("http://yukiironite.me:3000/img", 'GET', function(response){
    imgArray = JSON.parse(response);
    Pebble.sendAppMessage({img0: imgArray.slice(0,7200)}, messageSuccessHandler, messageFailureHandler);
  });
}

function messageAction(appMsg){
  switch(appMsg){
    case "load0":
      break;
    case "load1":
      Pebble.sendAppMessage({img1: imgArray.slice(7200,14400)}, messageSuccessHandler, messageFailureHandler);
      break;
    case "load2":
      Pebble.sendAppMessage({img2: imgArray.slice(14400,21600)}, messageSuccessHandler, messageFailureHandler);
      break;
    case "load3":
      Pebble.sendAppMessage({img3: imgArray.slice(21600,24192)}, messageSuccessHandler, messageFailureHandler);
      break;
    case "loadDone":
      getImage();
      break;
    default:
      break;
  }
}

// Called when JS is ready
Pebble.addEventListener("ready", function(e) {
  console.log("JS is ready!");
  //sendMessage();
  getImage();
  //Pebble.sendAppMessage(dict, messageSuccessHandler, messageFailureHandler);
});
												
// Called when incoming message from the Pebble is received
// We are currently only checking the "message" appKey defined in appinfo.json/Settings
Pebble.addEventListener("appmessage", function(e) {
  console.log("Received Message: " + e.payload.message);
  currentMsg = e.payload.message;
  messageAction(currentMsg);
});