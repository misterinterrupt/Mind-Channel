// if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
//   if (0 != (getApplicationInfo().flags &= ApplicationInfo.FLAG_DEBUGGABLE))
//   { WebView.setWebContentsDebuggingEnabled(true); }
// }
var app = (function app() {
  
  var config = {};

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
          callbackUrl : "gotOAuth.html", // this filename doesn't matter in this example
          signatureMethod : "HMAC-SHA1"
      };
      oauth = OAuth(options);
      // OAuth Step 1: Get request token
      oauth.request({'method': 'GET', 'url': config.evernoteHostName + '/oauth', 'success': success, 'failure': failure});
  };
  var success = function success(data) {
    var isCallBackConfirmed = false;
    var token = '';
    var vars = data.text.split("&");
    for (var i = 0; i < vars.length; i++) {
        var y = vars[i].split('=');
        if(y[0] === 'oauth_token')  {
            token = y[1];
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
        ref = window.open(config.evernoteHostName + '/OAuth.action?oauth_token=' + token, '_blank', 'location=no');
        ref.addEventListener('loadstart', function(event) { console.log('start: ' + event.url); }); 
        ref.addEventListener('loadstop', function(event) { console.log('stop: ' + event.url); }); 
        ref.addEventListener('loaderror', function(event) { console.log('error: ' + event.message); }); 
        ref.addEventListener('exit', function(event) { console.log(event.type); });
        ref.addEventListener('loadstart',
          function(event) {
            var loc = event.url;
            if (loc.indexOf('gotOAuth.html?') >= 0) {
              var index, verifier = '';
              var got_oauth = '';
              var params = loc.substr(loc.indexOf('?') + 1);
              params = params.split('&');
              for (var i = 0; i < params.length; i++) {
                var y = params[i].split('=');
                if(y[0] === 'oauth_verifier') {
                  verifier = y[1];
                }
              }
            } else if(y[0] === 'gotOAuth.html?oauth_token') {
              got_oauth = y[1];
            }
            // step 3
            oauth.setVerifier(verifier);
            oauth.setAccessToken([got_oauth, localStorage.getItem("oauth_token_secret")]);

            var getData = {'oauth_verifier': verifier};
            ref.close();
            oauth.request({'method': 'GET', 'url': config.evernoteHostName + '/oauth',
              'success': app.success, 'failure': app.failure});
          }
        );
    } else {
        // Step 4 : Get the final token
        var querystring = app.getQueryParams(data.text);
        var authTokenEvernote = querystring.oauth_token;
        // authTokenEvernote can now be used to send request to the Evernote Cloud API
        
        // Here, we connect to the Evernote Cloud API and get a list of all of the
        // notebooks in the authenticated user's account:
        var noteStoreURL = querystring.edam_noteStoreUrl;
        var noteStoreTransport = new Thrift.BinaryHttpTransport(noteStoreURL);
        var noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport);
        var noteStore = new NoteStoreClient(noteStoreProtocol);
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

  // return scope
  return {
    initialize: initialize,
    loginWithEvernote: loginWithEvernote
  }; // app return obj

})();
app.initialize(configs);
