/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};
$(document).ready(function() {
    app.initialize();
    $('.button-collapse').sideNav({
      menuWidth: '60%', // Default is 240
      edge: 'left', // Choose the horizontal origin
      closeOnClick: false // Closes side-nav on <a> clicks, useful for Angular/Meteor
    }
  );
  var config = {
      apiKey: "AIzaSyB2pXLe-_VBb9CAcKf1pTuwxatUDhmQmSU",
      authDomain: "notifica-28460.firebaseapp.com",
      databaseURL: "https://notifica-28460.firebaseio.com",
      storageBucket: "notifica-28460.appspot.com",
      messagingSenderId: "392656636873"
    };
  firebase.initializeApp(config);

  $( document ).on( "swipeleft",function() {
      $('.button-collapse').sideNav('hide');
  });

  $( document ).on( "swiperight",function() {
    $('.button-collapse').sideNav('show');
  });

  document.getElementById("register-button").addEventListener("click", function(){
    var email = $('#email-input').val();
    var pass = $('#pass-input').val() ;
    var confPass = $('#confpass-input').val();
    if(email === ''){
      Materialize.toast('Devi inserire un email valida', 3000 );
      return false;
    }
    if(pass != confPass || pass === ''){
      Materialize.toast('Le due password devono corrsipondere.', 3000 );
      return false;
    }
    firebase.auth().createUserWithEmailAndPassword(email, pass).then(function() {
        Materialize.toast('Registrazione avvenuta con successo.', 3000,'rounded' );
        setTimeout(function() {
            login(email,pass);
        }, 2000);
      }, function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        Materialize.toast('Errore registrazione: '+errorMessage, 3000 );
      });

  });
  document.getElementById("login-button").addEventListener("click", function(){
    var email = $('#email-input-login').val();
    var pass = $('#pass-input-login').val();
    if(validateLogin(email,pass)){

      login(email,pass);

    }
  });


});
function login(email,pass){
  firebase.auth().signInWithEmailAndPassword(email, pass).then(function() {
      Materialize.toast('Login avvenuto con successo.', 3000,'rounded' );
      $( ":mobile-pagecontainer" ).pagecontainer( "change", '#home-page', { transition: "slide", reverse: true } );
      return true;
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      Materialize.toast('Errore login: '+errorMessage, 3000 );
      return false;
    });
}

function validateLogin(email,pass){


  if(email === ''){
    Materialize.toast('Devi inserire un email valida', 3000 );
    return false;
  }
  if( pass === ''){
    Materialize.toast('La password non deve essere vuota.', 3000 );
    return false;
  }

  return true;
}
