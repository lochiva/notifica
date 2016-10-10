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

    user:{
      email: '',
      groups: {

      },
    },
    messages: [],
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
  var user = firebase.auth().currentUser;
  if (user) {
    readUsergroups();
    $(":mobile-pagecontainer").pagecontainer("change", '#home-page', {
            transition: "flip"
        });
  }
  // Nel caso di logout riposto alla pagina di login e nel caso di login salvo i dati utente
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user)  {
      $(":mobile-pagecontainer").pagecontainer("change", '#login-page', {
              transition: "flip"
          });
    }else{

    }
  });

  $( document ).on( "swipeleft",function() {
      startSpinner();
      $('#side-nav-button').sideNav('hide');
      stopSpinner();
  });

  $( document ).on( "swiperight",function() {
    startSpinner();
    $('#side-nav-button').sideNav('show');
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
  document.getElementById("send-button").addEventListener("click", sendMessage);
  document.getElementById("addGroup").addEventListener("click", function(){
    startSpinner();
    var group = $('#add-group-user').val();
    if(group !== undefined && group !== null){
      firebase.database().ref('/user_details/'+app.user.key+'/groups').push(group).then(function(snapshot){
        readUsergroups();

        Materialize.toast('Gruppo aggiunto.', 3000,'rounded');
        stopSpinner();
      }).catch(function(error) {

            Materialize.toast('Errore connessione: ' + error, 3000);
            stopSpinner();
      });
    }

  });
  document.getElementById("deleteGroup").addEventListener("click", function(){
    startSpinner();
      var key = $("#usergroups option:selected").attr('data-key');
      if(key !== undefined && key !== null){
        firebase.database().ref('/user_details/'+app.user.key+'/groups/'+key).remove().then(function(snapshot){
          readUsergroups();

          Materialize.toast('Gruppo elimninato.', 3000,'rounded');
          stopSpinner();
        }).catch(function(error) {

              Materialize.toast('Errore connessione: ' + error, 3000);
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
            readUsergroups();

            $('#new-group').val('');
            Materialize.toast('Gruppo creato ed aggiunto.', 3000,'rounded');
            stopSpinner();
          }).catch(function(error) {
                Materialize.toast('Errore connessione: ' + error, 3000);
                stopSpinner();

          });
          readGroups();
        }).catch(function(error) {

              Materialize.toast('Errore connessione: ' + error, 3000);
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
          listMessages();
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

                      Materialize.toast('Errore scrittura database: ' + error, 3000);
                      stopSpinner();


                  });
      setTimeout(function() {
          login(email,pass);
      }, 2000);
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      Materialize.toast('Errore registrazione: '+errorMessage, 3000 );
    });

}
function login(email,pass){
  startSpinner();
  firebase.auth().signInWithEmailAndPassword(email, pass).then(function() {
      Materialize.toast('Login avvenuto con successo.', 3000,'rounded' );
      $( ":mobile-pagecontainer" ).pagecontainer( "change", '#home-page', { transition: "fade" } );
      $('.user-email').html(email);
      readUsergroups();
      stopSpinner();
      return true;
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      Materialize.toast('Errore login: '+errorMessage, 3000 );
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
        Materialize.toast('Errore connessione: ' + error, 3000);

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
        Materialize.toast('Errore connessione: ' + error, 3000);

  });
}

function sendMessage(){
  startSpinner();
  if($('#user-to-send').val() != '' || $('#groupsname').val() != null){
    if($('#message').val().length > '5'){
      firebase.database().ref('messages').push({
          user: firebase.auth().currentUser.email,
          to: $('#user-to-send').val(),
          group: $('#groupsname').val(),
          timestamp: new Date().getTime(),
          text: $('#message').val()
        }).then(function(snapshot){

          Materialize.toast('Messaggio inviato con successo.', 3000,'rounded');
          stopSpinner();
      }).catch(function(error) {

            Materialize.toast('Errore connessione: ' + error, 3000);
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
        '<div class="collapsible-header"><i class="material-icons">message</i><b>Data: </b>'+data+to+'</div>'+
        '<div class="collapsible-body"><p>'+notifica.text+'</p></div>'+
      '</li>');


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
            '<div class="collapsible-header"><i class="material-icons">message</i><b>Data: </b>'+data+to+'</div>'+
            '<div class="collapsible-body"><p>'+notifica.text+'</p></div>'+
          '</li>');

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
      '<div class="collapsible-header"><i class="material-icons">message</i><b>Data: </b>'+data+to+'</div>'+
      '<div class="collapsible-body"><p>'+element.text+'</p></div>'+
    '</li>');

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

function startSpinner() {
    $('.custom-spinner').show();
}

function stopSpinner() {
    $('.custom-spinner').hide();
}
