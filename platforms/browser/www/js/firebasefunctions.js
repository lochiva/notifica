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
        var user = firebase.auth().currentUser;

        Materialize.toast('Registrazione avvenuta con successo.', 3000, 'rounded');
        firebase.database().ref('user_details/'+user.uid).set({
            email: email,
            groups: {
                first: 'general'
            }
        }).then(function() {


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
          $(":mobile-pagecontainer").pagecontainer("change", '#home-page', {
              transition: "fade"
          });
          $('.user-email').html(email);
        }, 1000);
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
    var ref = firebase.database().ref('/user_details/'+firebase.auth().currentUser.uid);
    ref.once('value').then(function(snapshot) {
        if(snapshot.val() !== null){
          var user_details = snapshot.val();

          //user_details = user_details[Object.keys(user_details)[0]];
          app.user = user_details;
          app.user.key = firebase.auth().currentUser.uid;
          //console.log(app.user);
          writeUserGroups(user_details);
        }

        if(reload){
          readMessagesOnce(10,5);
        }else{
          readMessages(10,5);
        }

        startSpinner();
        setTimeout(function() {
            app.listMessages();
            stopSpinner();
        }, 1000);

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

    ref.orderByChild('user').equalTo(app.user.email).limitToLast(limit).once('value', function(snapshot) {
      if(snapshot.val() !== null){
          $('#list-personal-messages').html('');
          var first = true;

          $.each(snapshot.val(), function(index, element) {
              prependPersonalMessage(element, index);
              if(first){
                app.lastPersonal = index;
                first = false;
              }
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
* Load more messages sent by the user
*/
function readMorePersonalMessages(limit){
  startSpinner();
  var ref = firebase.database().ref('/messages/');

  ref.orderByChild('user').startAt(app.user.email).endAt(app.user.email,app.lastPersonal)
  .limitToLast(limit).once('value', function(snapshot) {
    if(snapshot.val() !== null){
        var messages = snapshot.val();

        app.lastPersonal = Object.keys(messages)[0];
        var reverseKeys = Object.keys(messages).reverse();
        var first = true;

        $.each(reverseKeys, function(index, element) {
            //console.log(index);
            if(first){
              first = false;
            }else{
              appendPersonalMessage(messages[element], element);
            }


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
function readMessages(limit1,limit2) {

    var ref = firebase.database().ref('/messages/');

    ref.orderByChild('to').equalTo(app.user.email).limitToLast(limit1).on('child_added', window['user.ListenerFirebase'] = function(snapshot) {
        var key = snapshot.key;
        var notifica = snapshot.val();
        notifica.key = key;
        app.messages.push(notifica);
        if(app.lastMessagesTo === ''){
          //console.log(snapshot.key);
          app.lastMessagesTo = key;
        }
        prependMessage(notifica,key);

        if (app.inBackground && !app.readMessages[key]) {
            app.alertNotification(notifica.user);
        }


    }, function(error) {
        Materialize.toast('Errore connessione: ' + error, 5000);
        console.error(error);
    });
    if(app.user.groups !== ''){
      $.each(app.user.groups, function(index, element) {
          //console.log(element);
          addGroupListener(element,limit2);
      });
    }

}
/*
* Add Group Listener
*/
function addGroupListener(element,limit)
{
  var ref = firebase.database().ref('/messages/');

   ref.orderByChild('group').equalTo(element).limitToLast(limit).on('child_added', window[element+'ListenerFirebase'] = function(snapshot) {
      var key = snapshot.key;
      var notifica = snapshot.val();
      notifica.key = key;
      app.messages.push(notifica);
      if(app.lastMessagesGroups[element] === undefined){
        app.lastMessagesGroups[element] = key;
      }
      prependMessage(notifica,key);

      if (app.inBackground && !app.readMessages[key]) {
          app.alertNotification(notifica.user);
      }

  }, function(error) {
      Materialize.toast('Errore connessione: ' + error, 5000);
      console.error(error);
  });

}
/**
* Remove Group Listener
*/
function removeGroupListener(element,limit)
{
  var ref = firebase.database().ref('/messages/');
  ref.orderByChild('group').equalTo(element).limitToLast(limit).off('child_added',window[element+'ListenerFirebase'] );
}
/**
* Remove User Listenr
*/
function removeUserListener(email,limit)
{
  var ref = firebase.database().ref('/messages/');

  ref.orderByChild('to').equalTo(email).limitToLast(limit).off('child_added',window['user.ListenerFirebase'] );

}
/**
* Read messages Once
*/
function readMessagesOnce(limit1,limit2){
  var ref = firebase.database().ref('/messages/');
  //.equalTo(firebase.auth().currentUser.email).limitToLast(limit1).
  ref.orderByChild('to').equalTo(app.user.email).limitToLast(limit1).once('value', function(snapshot) {
      var notifica = snapshot.val();
      if(notifica !== null){
      var first = true;
      $.each(snapshot.val(), function(index, element) {
        if(first){
          app.lastMessagesTo = index;
          first = false;
        }
            element.key = index;
            app.messages.push(element);
            prependMessage(element,index);
            if (app.inBackground && !app.readMessages[index]) {
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
            var first = true;
              $.each(snapshot.val(), function(i, elem) {
                if(first){
                  app.lastMessagesGroups[element] = i;
                  first = false;
                }
                    elem.key = i;
                    app.messages.push(elem);
                    prependMessage(elem,i);
                    if (app.inBackground && !app.readMessages[i]) {
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
* Load more messages
*/
function readMoreMessages(limit1,limit2){
  var ref = firebase.database().ref('/messages/');
//console.log(app.lastMessagesTo);
  if(app.lastMessagesTo !== ''){
    ref.orderByChild('to').startAt(app.user.email).endAt(app.user.email,app.lastMessagesTo)
    .limitToLast(limit1).once('value', function(snapshot) {
        var notifica = snapshot.val();
        if(notifica !== null){
          //console.log(app.lastMessagesTo);

          app.lastMessagesTo = Object.keys(notifica)[0];
          var reverseKeys = Object.keys(notifica).reverse();
          var first = true;

          $.each(reverseKeys, function(index, element) {
              //console.log(index);
              if(first){
                first = false;
              }else{
                notifica[element].key = element;
                app.messages.push(notifica[element]);
                appendMessage(notifica[element], element);
              }


          });

      }


    }, function(error) {
        Materialize.toast('Errore connessione: ' + error, 5000);
        console.error(error);
    });
  }

  if(app.user.groups !== ''){
    $.each(app.user.groups, function(index, element) {
        //console.log(element);
        var ref = firebase.database().ref('/messages/');
        if(app.lastMessagesGroups[element] !== undefined){
          ref.orderByChild('group').startAt(element).endAt(element,app.lastMessagesGroups[element])
          .limitToLast(limit2).once('value', function(snapshot) {
            var notifica = snapshot.val();
            if(notifica !== null){

                app.lastMessagesGroups[element] = Object.keys(notifica)[0];
                var reverseKeys = Object.keys(notifica).reverse();
                var first = true;

                $.each(reverseKeys, function(i, elem) {
                    //console.log(index);
                    if(first){
                      first = false;
                    }else{
                      notifica[elem].key = elem;
                      app.messages.push(notifica[elem]);
                      appendMessage(notifica[elem], elem);
                    }


                });


            }

          }, function(error) {
              Materialize.toast('Errore connessione: ' + error, 5000);
              console.error(error);
          });
        }
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
              // Se sto inviando a un utente salvo la sua email per l'autocomplete
                if($('#user-to-send').val() !== ''){
                  saveUserEmail($('#user-to-send').val());
                  var data = {};
                  data[$('#user-to-send').val()] = null;
                  $('input.autocomplete').autocomplete({data: data});
                }

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
/*
* CREATE GROUP
*/
function createGroup(group) {
  firebase.database().ref('groups/' + group).set({
      name: group
  }).then(function(snapshot) {
      firebase.database().ref('/user_details/' + app.user.key + '/groups').push(group).then(function(snapshot) {
          addGroupListener(group,5);
          app.messages = [];
          readUsergroups(true);

          $('#new-group').val('');
          Materialize.toast('Gruppo creato ed aggiunto.', 3000, 'rounded');
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
/*
* ADD GROUP
*/
function addGroup(group) {
  firebase.database().ref('/user_details/' + app.user.key + '/groups').push(group).then(function(snapshot) {
      addGroupListener(group,5);
      setTimeout(function() {
        app.messages = [];
        readUsergroups(true);

        Materialize.toast('Gruppo aggiunto.', 3000, 'rounded');
        stopSpinner();

      }, 1000);

  }).catch(function(error) {

      Materialize.toast('Errore connessione: ' + error, 5000);
      stopSpinner();
  });
}
/*
* Delete GROUP
*/
function deleteGroup(key) {
  firebase.database().ref('/user_details/' + app.user.key + '/groups/' + key).remove().then(function(snapshot) {
      removeGroupListener(app.user.groups[key],5);
      setTimeout(function() {
        app.messages = [];
        readUsergroups(true);

        Materialize.toast('Gruppo elimninato.', 3000, 'rounded');
        stopSpinner();

      }, 1000);

  }).catch(function(error) {

      Materialize.toast('Errore connessione: ' + error, 5000);
      stopSpinner();
  });
}
