// if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
//   if (0 != (getApplicationInfo().flags &= ApplicationInfo.FLAG_DEBUGGABLE))
//   { WebView.setWebContentsDebuggingEnabled(true); }
// }
var app = (function app() {
  
  var config = {},
      options = {};

  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  var bindEvents = function bindEvents() {
      document.addEventListener('deviceready', onDeviceReady, false);
  };

  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  var onDeviceReady = function onDeviceReady() {
      receivedEvent('deviceready');
  };
  // Update DOM on a Received Event
  var receivedEvent = function receivedEvent(id) {
      var parentElement = document.getElementById(id);
      var listeningElement = parentElement.querySelector('.listening');
      var receivedElement = parentElement.querySelector('.received');

      listeningElement.setAttribute('style', 'display:none;');
      receivedElement.setAttribute('style', 'display:block;');

      console.log('Received Event: ' + id);
  };
  // Application Constructor
  var initialize = function initialize(configs) {
      if (configs){
        config = configs;
      }
      bindEvents();
  };
  var loginWithEvernote = function loginWithEvernote() {
      options = {
          consumerKey: config.consumerKey,
          consumerSecret: config.consumerSecret,
          callbackUrl : "redirect.html", // this filename doesn't matter in this example
          signatureMethod : "HMAC-SHA1"
      };
      oauth = OAuth(options);
      // OAuth Step 1: Get request token
      oauth.request({'method': 'GET', 'url': config.evernoteHostName + '/oauth', 'success': success, 'failure': failure});
  };
  var success = function success(data) {
    var isCallBackConfirmed = false;
      var tempToken = '';
      var vars = data.text.split("&");
      for (var i = 0; i < vars.length; i++) {
        var y = vars[i].split('=');
        if(y[0] === 'oauth_token')  {
          tempToken = y[1];
        }
        else if(y[0] === 'oauth_token_secret') {
          this.oauth_token_secret = y[1];
          localStorage.setItem("oauth_token_secret", y[1]);
        }
        else if(y[0] === 'oauth_callback_confirmed') {
          isCallBackConfirmed = true;
        }
      }
      var ref;
      if(isCallBackConfirmed) {
         // step 2
         ref = window.open(config.evernoteHostName + '/OAuth.action?oauth_token=' + tempToken, '_blank');
         ref.addEventListener('loadstart', function(event) {
                              //alert(event.type + ' - ' + event.url);
                              var loc = event.url;
                              if (loc.indexOf('/redirect.html?') > 0) {
                                    var index, verifier = '';
                                    var got_oauth = '';
                                    var params = loc.substr(loc.indexOf('?') + 1);
                                    params = params.split('&');
                                    for (var i = 0; i < params.length; i++) {
                                        var y = params[i].split('=');
                                        if(y[0] === 'oauth_verifier') {
                                            verifier = y[1];
                                        }
                                        else if(y[0] === 'oauth_token') {
                                            got_oauth = y[1];
                                        }
                                    }
                              // step 3
                              oauth.setVerifier(verifier);
                              oauth.setAccessToken([got_oauth, localStorage.getItem("oauth_token_secret")]);
                              
                              var getData = { 'oauth_verifier': verifier };
                              ref.close();
                              delete ref;
                              oauth.request({'method': 'GET', 'url': config.evernoteHostName + '/oauth',
                                            'success': success, 'failure': failure});

                              }
                              });
         
      } else {
         var querystring = getQueryParams(data.text);
         var noteStoreURL = querystring.edam_noteStoreUrl;
         var noteStoreTransport = new Thrift.BinaryHttpTransport(noteStoreURL);
         var noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport);
         var noteStore = new NoteStoreClient(noteStoreProtocol);
         var authTokenEvernote = querystring.oauth_token; 
         noteStore.listNotebooks(authTokenEvernote, function (notebooks) {
                                 console.log(notebooks);
                                 },
                                 function onerror(error) {
                                 console.log(error);
                                 });
         var note = new Note;
         note.content = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\"><en-note><span style=\"font-weight:bold;\">Hello photo note.</span><br /><span>Evernote logo :</span><br /></en-note>";
         note.title = "Hello javascript lib";
         noteStore.createNote(authTokenEvernote,note,function (noteCallback) {
                              console.log(noteCallback.guid + " created");
                              });
      }
       
  };
  var failure = function failure(error) {
      console.log('error ' + error.text);
  };
  var getQueryParams = function getQueryParams(queryParams) {
    var i, query_array,
    query_array_length, key_value, decode = OAuth.urlDecode,querystring = {};
    // split string on '&'
    query_array = queryParams.split('&');
    // iterate over each of the array items
    for (i = 0, query_array_length = query_array.length; i < query_array_length; i++) {
      // split on '=' to get key, value
      key_value = query_array[i].split('=');
      if (key_value[0] != "") {
        querystring[key_value[0]] = decode(key_value[1]);
      }
    }
    return querystring;
  }

  // return scope
  return {
    initialize: initialize,
    loginWithEvernote: loginWithEvernote
  }; // app return obj

})();
app.initialize(configs);
