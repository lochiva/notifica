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
 *
 *  FUNCTIONS COMUNICATE WITH FIREBASE
 */
/**
* Function for register a new user.
*/
function register(email, pass) {
    startSpinner();
    firebase.auth().createUserWithEmailAndPassword(email, pass).then(function() {
        app.firebaseConnected = true;
        firebase.database().goOnline();
        Materialize.toast('Registrazione avvenuta con successo.', 3000, 'rounded');
        firebase.database().ref('user_details/').push({
            email: email,
            groups: {
                first: 'general'
            }
        }).then(function() {

          var user = firebase.auth().currentUser;

          user.sendEmailVerification().then(function() {
            // Email sent.
          }, function(error) {
            Materialize.toast('Errore invio email: ' + error, 5000);
            stopSpinner();
          });
            stopSpinner();
        }).catch(function(error) {

            Materialize.toast('Errore scrittura database: ' + error, 5000);
            stopSpinner();


        });
        setTimeout(function() {
            login(email, pass);
        }, 2000);
    }, function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        Materialize.toast('Errore registrazione: ' + errorMessage, 5000);
    });

}

/**
* Login with firebase function
*/
function login(email, pass) {
    startSpinner();
    firebase.auth().signInWithEmailAndPassword(email, pass).then(function() {
        app.firebaseConnected = true;
        firebase.database().goOnline();
        Materialize.toast('Login avvenuto con successo.', 3000, 'rounded');
        $(":mobile-pagecontainer").pagecontainer("change", '#home-page', {
            transition: "fade"
        });
        $('.user-email').html(email);

        //readUsergroups();
        stopSpinner();
        return true;
    }, function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        Materialize.toast('Errore login: ' + errorMessage, 5000);
        stopSpinner();
        return false;
    });
}

/**
* Read the user groups
*/
function readUsergroups(reload) {
    var ref = firebase.database().ref('/user_details/');
    ref.orderByChild('email').equalTo(firebase.auth().currentUser.email).once('value').then(function(snapshot) {
        if(snapshot.val() !== null){
          var user_details = snapshot.val();
          var key = Object.keys(user_details)[0];
          user_details = user_details[Object.keys(user_details)[0]];
          app.user = user_details;
          app.user.key = key;
          //console.log(app.user);
          writeUserGroups(user_details);
        }

        if(reload){
          readMessagesOnce(10,5);
        }else{
          readMessages();
        }

        startSpinner();
        setTimeout(function() {
            app.listMessages();
            stopSpinner();
        }, 2000);

    }).catch(function(error) {
        Materialize.toast('Errore connessione: ' + error, 5000);

    });
}

/**
* Read all the groups are in the database
*/
function readGroups() {
    firebase.database().ref('/groups').once('value').then(function(snapshot) {
        var groups = snapshot.val();
        if (groups !== null && groups !== '') {
            $('.groupsname').html('<option data-role="none" value="" disabled selected>Scegli un gruppo</option>');
            $.each(groups, function(index, element) {
                $('.groupsname').append('<option data-role="none" value="' + element.name + '">' + element.name + '</option>');
            });
        }

    }).catch(function(error) {
        Materialize.toast('Errore connessione: ' + error, 5000);

    });
}

/**
* Read sent message of the user
*/
function readPersonalMessages(limit) {
    startSpinner();
    var ref = firebase.database().ref('/messages/');

    ref.orderByChild('user').equalTo(firebase.auth().currentUser.email).limitToLast(limit).once('value', function(snapshot) {
      if(snapshot.val() !== null){
          $('#list-personal-messages').html('');
          $.each(snapshot.val(), function(index, element) {
              prependPersonalMessage(element, index);
          });
      }
        stopSpinner();
    }, function(error) {
        stopSpinner();
        Materialize.toast('Errore connessione: ' + error, 5000);
        console.error(error);
    });
}

/**
* Read messages
*/
function readMessages() {

    var ref = firebase.database().ref('/messages/');

    ref.orderByChild('to').equalTo(firebase.auth().currentUser.email).limitToLast(10).on('child_added', function(snapshot) {

        var notifica = snapshot.val();
        app.messages.push(notifica);
        prependMessage(notifica);

        if (app.inBackground) {
            app.alertNotification(notifica.user);
        }


    }, function(error) {
        Materialize.toast('Errore connessione: ' + error, 5000);
        console.error(error);
    });
    if(app.user.groups !== ''){
      $.each(app.user.groups, function(index, element) {
          //console.log(element);
          var ref = firebase.database().ref('/messages/');
          ref.orderByChild('group').equalTo(element).limitToLast(5).on('child_added', function(snapshot) {

              var notifica = snapshot.val();
              app.messages.push(notifica);
              prependMessage(notifica);

              if (app.inBackground) {
                  app.alertNotification(notifica.user);
              }

          }, function(error) {
              Materialize.toast('Errore connessione: ' + error, 5000);
              console.error(error);
          });
      });
    }

}

/**
* Read messages Once
*/
function readMessagesOnce(limit1,limit2){
  var ref = firebase.database().ref('/messages/');

  ref.orderByChild('to').equalTo(firebase.auth().currentUser.email).limitToLast(limit1).once('value', function(snapshot) {
      var notifica = snapshot.val();
      if(notifica !== null){
      $.each(snapshot.val(), function(index, element) {
            app.messages.push(element);
            prependMessage(element);
            if (app.inBackground) {
                app.alertNotification(element.user);
            }
      });
    }


  }, function(error) {
      Materialize.toast('Errore connessione: ' + error, 5000);
      console.error(error);
  });
  if(app.user.groups !== ''){
    $.each(app.user.groups, function(index, element) {
        //console.log(element);
        var ref = firebase.database().ref('/messages/');
        ref.orderByChild('group').equalTo(element).limitToLast(limit2).once('value', function(snapshot) {
          var notifica = snapshot.val();
          if(notifica !== null){

              $.each(snapshot.val(), function(i, elem) {
                    app.messages.push(elem);
                    prependMessage(elem);
                    if (app.inBackground) {
                        app.alertNotification(elem.user);
                    }
              });

          }

        }, function(error) {
            Materialize.toast('Errore connessione: ' + error, 5000);
            console.error(error);
        });
    });
  }
}

/**
* Delete a message with the key
*/
function deleteMessage(key) {
    startSpinner();
    firebase.database().ref('/messages/' + key).remove().then(function(snapshot) {

        $('#' + key).remove();
        Materialize.toast('Messaggio elimninato.', 3000, 'rounded');
        stopSpinner();
    }).catch(function(error) {

        Materialize.toast('Errore connessione: ' + error, 5000);
        stopSpinner();
    });

}

/**
* Send a new message
*/
function sendMessage() {
    if (app.firebaseConnected) {
        startSpinner();
        if ($('#user-to-send').val() !== '' || $('#groupsname').val() !== null) {
            if ($('#message').val().length > '5') {
                firebase.database().ref('messages').push({
                    user: firebase.auth().currentUser.email,
                    to: $('#user-to-send').val(),
                    group: $('#groupsname').val(),
                    timestamp: new Date().getTime(),
                    text: $('#message').val()
                }).then(function(snapshot) {
                    $('#user-to-send').val('');
                    $('#message').val('');
                    readGroups();
                    Materialize.toast('Messaggio inviato con successo.', 3000, 'rounded');
                    stopSpinner();
                }).catch(function(error) {

                    Materialize.toast('Errore connessione: ' + error, 5000);
                    stopSpinner();
                });
            } else {

                Materialize.toast('Il messaggio deve essere almeno di 4 caratteri.', 4000);
                stopSpinner();
            }
        } else {

            Materialize.toast('Devi inserire un utente o selezionare un gruppo.', 4000);
            stopSpinner();
        }
    } else {
        Materialize.toast('Connettività assente.', 4000);
    }

}
