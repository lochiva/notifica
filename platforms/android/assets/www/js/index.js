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
        stopSpinner();
        cordova.plugins.backgroundMode.enable();
        cordova.plugins.backgroundMode.setDefaults({
            title:  "Notifica",
            text:   "L'applicazione è in ascolto.",
            color: "123456",
            silent: false
        });
        /*cordova.plugins.backgroundMode.configure({
            silent: false
        });*/

        // 2) Now the app runs ins background but stays awake
        cordova.plugins.backgroundMode.onactivate = function () {
            app.inBackground = true;
            /*setInterval(function () {
                cordova.plugins.notification.badge.increase();
            }, 1000);*/
        };

        // 3) App is back to foreground
        cordova.plugins.backgroundMode.ondeactivate = function () {
          app.inBackground = false;
        };
    },

    user:{
      email: '',
      groups: {

      },
    },
    messages: [],
    inBackground: false,
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        /*var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');*/

        console.log('Received Event: ' + id);
    }
};
$(document).ready(function() {
    app.initialize();
    $('#side-nav-button').sideNav({
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
  // Controllo se l'utente è loggato, e nel caso apro la home-page
  // Nel caso di logout riposto alla pagina di login
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user)  {
      $(":mobile-pagecontainer").pagecontainer("change", '#login-page', {
              transition: "flip"
          });
    }else{
      startSpinner();
      readUsergroups();
      $(":mobile-pagecontainer").pagecontainer("change", '#home-page', {
              transition: "flip"
          });
      $('.user-email').html(user.email);
      stopSpinner();
    }
  });
  // Caso di chiusura applicazione
  window.onbeforeunload = function(e) {
    if(!$("#remember-me").is(':checked')){
      firebase.auth().signOut().then(function() {
        // Sign-out successful.
      }, function(error) {
        // An error happened.
      });
    }
  };

  $( document ).on( "swipeleft",function() {

      $('#side-nav-button').sideNav('hide');

  });

  $( document ).on( "swiperight",function() {

    var id = $(':mobile-pagecontainer').pagecontainer('getActivePage').attr('id');
    if(id == 'home-page'){
      $('#side-nav-button').sideNav('show');
    }
    
  });
  document.getElementById("show-personal-list").addEventListener("click", function(){
    startSpinner();
    $('#list-messages').hide();
    $('#list-personal-messages').show();
    readPersonalMessages();
    $('#side-nav-button').sideNav('hide');
    stopSpinner();
  });
  document.getElementById("show-messages-list").addEventListener("click", function(){
    startSpinner();
    $('#list-personal-messages').hide();
    $('#list-messages').show();
    $('#side-nav-button').sideNav('hide');
    stopSpinner();
  });
  document.getElementById("register-button").addEventListener("click", function(){
    startSpinner();
    var email = $('#email-input').val();
    var pass = $('#pass-input').val() ;
    var confPass = $('#confpass-input').val();
    if(email === ''){
      Materialize.toast('Devi inserire un email valida', 3000 );
      stopSpinner();
      return false;
    }
    if(pass != confPass || pass === ''){
      Materialize.toast('Le due password devono corrsipondere.', 3000 );
      stopSpinner();
      return false;
    }
    register(email,pass);


  });
  document.getElementById("login-button").addEventListener("click", function(){
    startSpinner();
    var email = $('#email-input-login').val();
    var pass = $('#pass-input-login').val();
    if(validateLogin(email,pass)){

      login(email,pass);

    }
    stopSpinner();
  });
  document.getElementById("logout-button").addEventListener("click", function(){
    startSpinner();
      firebase.auth().signOut().then(function() {
        firebase.database().goOffline();
        stopSpinner();
      }, function(error) {
        Materialize.toast('Errore connessione: ' + error, 5000);
        stopSpinner();
      });
  });
  document.getElementById("send-button").addEventListener("click", sendMessage);
  document.getElementById("addGroup").addEventListener("click", function(){
    startSpinner();
    var group = $('#add-group-user').val();
    if(group !== undefined && group !== null){
      firebase.database().ref('/user_details/'+app.user.key+'/groups').push(group).then(function(snapshot){
        app.messages = [];
        readUsergroups();

        Materialize.toast('Gruppo aggiunto.', 3000,'rounded');
        stopSpinner();
      }).catch(function(error) {

            Materialize.toast('Errore connessione: ' + error, 5000);
            stopSpinner();
      });
    }

  });
  document.getElementById("deleteGroup").addEventListener("click", function(){
    startSpinner();
      var key = $("#usergroups option:selected").attr('data-key');
      if(key !== undefined && key !== null){
        firebase.database().ref('/user_details/'+app.user.key+'/groups/'+key).remove().then(function(snapshot){
          app.messages = [];
          readUsergroups();

          Materialize.toast('Gruppo elimninato.', 3000,'rounded');
          stopSpinner();
        }).catch(function(error) {

              Materialize.toast('Errore connessione: ' + error, 5000);
              stopSpinner();
        });
      }

  });
  document.getElementById("createGroup").addEventListener("click", function(){
    startSpinner();
      var group = $('#new-group').val();
      if(group !== undefined && group !== null && group !== ''){
        firebase.database().ref('groups/'+group).set({ name: group }).then(function(snapshot){
          firebase.database().ref('/user_details/'+app.user.key+'/groups').push(group).then(function(snapshot){
            app.messages = [];
            readUsergroups();

            $('#new-group').val('');
            Materialize.toast('Gruppo creato ed aggiunto.', 3000,'rounded');
            stopSpinner();
          }).catch(function(error) {
                Materialize.toast('Errore connessione: ' + error, 5000);
                stopSpinner();

          });
          readGroups();
        }).catch(function(error) {

              Materialize.toast('Errore connessione: ' + error, 5000);
              stopSpinner();

        });
      }

  });
  /**
     * PAGECHANGE BIND take picture if not taked
     */
  $(document).on("pagechange", function() {

        $('#side-nav-button').sideNav('hide');
        var id = $(':mobile-pagecontainer').pagecontainer('getActivePage').attr('id');
        if (id == 'send-message' ) {
            $('#user-to-send').val('');
            $('#message').val('');
            readGroups();
        }else if(id == 'home-page'){
          $('#list-personal-messages').hide();
          $('#list-messages').show();
          //listMessages();
        }else if(id == 'profile-page'){
          readGroups();
        }

  });


});
function register(email,pass){
  startSpinner();
  firebase.auth().createUserWithEmailAndPassword(email, pass).then(function() {
      Materialize.toast('Registrazione avvenuta con successo.', 3000,'rounded' );
      firebase.database().ref('user_details/').push({
                      email: email,
                      groups: {
                        first: 'general'
                      }
                  }).then(function() {
                    stopSpinner();
                  }).catch(function(error) {

                      Materialize.toast('Errore scrittura database: ' + error, 5000);
                      stopSpinner();


                  });
      setTimeout(function() {
          login(email,pass);
      }, 2000);
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      Materialize.toast('Errore registrazione: '+errorMessage, 5000 );
    });

}
function login(email,pass){
  startSpinner();
  firebase.auth().signInWithEmailAndPassword(email, pass).then(function() {
      Materialize.toast('Login avvenuto con successo.', 3000,'rounded' );
      $( ":mobile-pagecontainer" ).pagecontainer( "change", '#home-page', { transition: "fade" } );
      $('.user-email').html(email);

      //readUsergroups();
      stopSpinner();
      return true;
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      Materialize.toast('Errore login: '+errorMessage, 5000 );
      stopSpinner();
      return false;
    });
}

function readUsergroups(){
  var ref = firebase.database().ref('/user_details/');
  ref.orderByChild('email').equalTo(firebase.auth().currentUser.email).once('value').then(function(snapshot) {
    var user_details = snapshot.val();
    var key = Object.keys(user_details)[0];
    user_details = user_details[Object.keys(user_details)[0]];
    app.user = user_details;
    app.user.key = key;
    //console.log(app.user);
    $('#groups-list').html('');
    $('#usergroups').html('<option data-role="none" value="" disabled selected>Scegli un gruppo</option>');
    $.each(user_details.groups, function(index, element) {
      $('#groups-list').append('<div class="chip">'+element+'</div>');
        $('#usergroups').append('<option data-role="none" data-key="'+index+'" value="'+element+'">'+element+'</option>');
    });
    readMessages();
    setTimeout(function() {
        listMessages();
    }, 2000);

  }).catch(function(error) {
        Materialize.toast('Errore connessione: ' + error, 5000);

  });
}

function readGroups(){
  firebase.database().ref('/groups').once('value').then(function(snapshot) {
    var groups = snapshot.val();
    if (groups !== null && groups !== ''){
      $('.groupsname').html('<option data-role="none" value="" disabled selected>Scegli un gruppo</option>');
        $.each(groups, function(index, element) {
          $('.groupsname').append('<option data-role="none" value="'+element.name+'">'+element.name+'</option>');
        });
    }

  }).catch(function(error) {
        Materialize.toast('Errore connessione: ' + error, 5000);

  });
}

function sendMessage(){
  startSpinner();
  if($('#user-to-send').val() !== '' || $('#groupsname').val() !== null){
    if($('#message').val().length > '5'){
      firebase.database().ref('messages').push({
          user: firebase.auth().currentUser.email,
          to: $('#user-to-send').val(),
          group: $('#groupsname').val(),
          timestamp: new Date().getTime(),
          text: $('#message').val()
        }).then(function(snapshot){
          $('#user-to-send').val('');
          $('#message').val('');
          readGroups();
          Materialize.toast('Messaggio inviato con successo.', 3000,'rounded');
          stopSpinner();
      }).catch(function(error) {

            Materialize.toast('Errore connessione: ' + error, 5000);
            stopSpinner();
      });
    }else{

      Materialize.toast('Il messaggio deve essere almeno di 4 caratteri.', 4000);
      stopSpinner();
    }
  }else{

    Materialize.toast('Devi inserire un utente o selezionare un gruppo.', 4000);
    stopSpinner();
  }

}

function readPersonalMessages(){
  startSpinner();
  var ref = firebase.database().ref('/messages/');

  ref.orderByChild('user').equalTo(firebase.auth().currentUser.email).limitToLast(20).once('value', function(snapshot) {
          $('#list-personal-messages').html('');
          $.each(snapshot.val(), function(index, element) {
            var data = (new Date(element.timestamp)).toISOString().substring(0, 19).replace('T', ' ');
            var to = '';
            if(element.group !== undefined && element.group !== ''){
              to = ' <b>Group:</b> '+element.group;
            }else{
              to = ' <b>To:</b> '+element.to;
            }
            $('#list-personal-messages').prepend('<li id="'+index+'" data-role="none">'+
              '<div class="collapsible-header"><i class="material-icons">email</i>'+
              '<b>Data: </b>'+data+to+' <b>From: </b>'+element.user+
              ' <button class="waves-effect waves-light btn blue-grey" onClick="deleteMessage(\''+index+'\')">Elimina</button></div>'+
              '<div class="collapsible-body"><p>'+element.text+'</p></div>'+
            '</li>');
          });
          stopSpinner();
      },function(error) {
        stopSpinner();
        Materialize.toast('Errore connessione: ' + error, 5000);
        console.error(error);
      });
}

function reloadMessages(){
  startSpinner();
  app.messages = [];
  readUsergroups();
  stopSpinner();

}

function readMessages(){

  var ref = firebase.database().ref('/messages/');

  ref.orderByChild('to').equalTo(firebase.auth().currentUser.email).limitToLast(10).on('child_added', function(snapshot) {
      $.each(snapshot.val(), function(index, element) {

      });
      var notifica = snapshot.val();
      app.messages.push(snapshot.val());
      var data = (new Date(notifica.timestamp)).toISOString().substring(0, 19).replace('T', ' ');
      var to = '';
      if(notifica.group !== undefined && notifica.group !== ''){
        to = ' <b>Group:</b> '+notifica.group;
      }else{
        to = ' <b>To:</b> '+notifica.to;
      }
      $('#list-messages').prepend('<li data-role="none">'+
        '<div class="collapsible-header blink" onclick="removeBlink(this)"><i class="material-icons">message</i>'+
        '<b>Data: </b>'+data+to+' <b>From: </b>'+notifica.user+'</div>'+
        '<div class="collapsible-body"><p>'+notifica.text+'</p></div>'+
      '</li>');
      if(app.inBackground){
          alertNotification(notifica.user);
      }


  },function(error) {
    Materialize.toast('Errore connessione: ' + error, 5000);
    console.error(error);
  });
    $.each(app.user.groups, function(index, element) {
      //console.log(element);
      var ref = firebase.database().ref('/messages/');
      ref.orderByChild('group').equalTo(element).limitToLast(5).on('child_added', function(snapshot) {
          $.each(snapshot.val(), function(index, element) {

          });
          var notifica = snapshot.val();
          app.messages.push(snapshot.val());
          var data = (new Date(notifica.timestamp)).toISOString().substring(0, 19).replace('T', ' ');
          var to = '';
          if(notifica.group !== undefined && notifica.group !== ''){
            to = ' <b>Group:</b> '+notifica.group;
          }else{
            to = ' <b>To:</b> '+notifica.to;
          }
          $('#list-messages').prepend('<li data-role="none">'+
            '<div class="collapsible-header blink" onclick="removeBlink(this)"><i class="material-icons" >message</i>'+
            '<b>Data: </b>'+data+to+' <b>From: </b>'+notifica.user+'</div>'+
            '<div class="collapsible-body"><p>'+notifica.text+'</p></div>'+
          '</li>');
          if(app.inBackground){
            alertNotification(notifica.user);
          }

        },function(error) {
          Materialize.toast('Errore connessione: ' + error, 5000);
          console.error(error);
        });
    });

}

function listMessages()
{
  $('#list-messages').html('');
  list = app.messages;
  list.sort(function(a,b){
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return a.timestamp - b.timestamp;
    });
  $.each(list, function(index, element) {
    var data = (new Date(element.timestamp)).toISOString().substring(0, 19).replace('T', ' ');
    var to = '';
    if(element.group !== undefined && element.group !== ''){
      to = ' <b>Group:</b> '+element.group;
    }else{
      to = ' <b>To:</b> '+element.to;
    }
    $('#list-messages').prepend('<li data-role="none">'+
      '<div class="collapsible-header blink" onclick="removeBlink(this)"><i class="material-icons">message</i>'+
      '<b>Data: </b>'+data+to+' <b>From: </b>'+element.user+'</div>'+
      '<div class="collapsible-body"><p>'+element.text+'</p></div>'+
    '</li>');

  });

}

function deleteMessage(key){
  startSpinner();
  firebase.database().ref('/messages/'+key).remove().then(function(snapshot){

    $('#'+key).remove();
    Materialize.toast('Messaggio elimninato.', 3000,'rounded');
    stopSpinner();
  }).catch(function(error) {

        Materialize.toast('Errore connessione: ' + error, 5000);
        stopSpinner();
  });

}

function alertNotification(val)
{
    cordova.plugins.backgroundMode.configure({
        title: 'Notifica ricevuta da '+val+', apri per visualizzare.',
    });
    var now = new Date().getTime(),
        _4_sec_from_now = new Date(now + 4 * 1000);
    cordova.plugins.notification.local.schedule({
        id: now,
        title: 'Notifica ricevuta',
        text: 'From: '+val,
        at: _4_sec_from_now,
        icon: "res://icon.png",
        led: "2196F3"
    });
/*  function onConfirm(buttonIndex) {
      alert('You selected button ' + buttonIndex);
  }*/
  /*navigator.notification.confirm(
      'Notifica ricevuta da '+val+', apri per visualizzare.', // message
       onConfirm,            // callback to invoke with index of button pressed
      'Notifica',           // title
      ['Apri','Exit']     // buttonLabels
  );*/
  //navigator.notification.beep(1);
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

function removeBlink(elem){
  elem.classList.remove("blink");
}

function startSpinner() {
    $('.custom-spinner').show();
}

function stopSpinner() {
    $('.custom-spinner').hide();
}

/**
* STORAGE FUNCTIONS
*
*/

function checkStorage(){
  if (typeof window.localStorage != undefined ) {
    return true;
  }else{
    return false;
  }
}

function setStorage(name, val){
  if(checkStorage()){
    localStorage.setItem(name, val);
    return true;
  }else{
    return false;
  }
}

function getStorage(name){
  var val = localStorage.getItem(name);
  if(val != undefined && val != null){
    return val;
  }else{
    return false;
  }
}

function deleteStorage(name){
  localStorage.removeItem(name);
}
