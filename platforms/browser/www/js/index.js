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
        cordova.plugins.backgroundMode.enable();
        cordova.plugins.backgroundMode.setDefaults({
            title: "Notifica",
            text: "L'applicazione è in ascolto.",
            color: "123456",
            silent: false
        });
        /*cordova.plugins.backgroundMode.configure({
            silent: false
        });*/

        // 2) Now the app runs ins background but stays awake
        cordova.plugins.backgroundMode.onactivate = function() {
            app.inBackground = true;
            /*setInterval(function () {
                cordova.plugins.notification.badge.increase();
            }, 1000);*/
        };

        // 3) App is back to foreground
        cordova.plugins.backgroundMode.ondeactivate = function() {
            app.inBackground = false;
        };
        stopSpinner();
    },
    alertNotification: function(user) {
        cordova.plugins.backgroundMode.configure({
            title: 'Notifica ricevuta da ' + user + ', apri per visualizzare.',
        });
        var now = new Date().getTime(),
            _4_sec_from_now = new Date(now + 4 * 1000);
        cordova.plugins.notification.local.schedule({
            id: now,
            title: 'Notifica ricevuta',
            text: 'From: ' + user,
            at: _4_sec_from_now,
            icon: "res://icon.png",
            led: "2196F3"
        });

    },

    listMessages: function() {
        $('#list-messages').html('');
        list = app.messages;
        list.sort(function(a, b) {
            // Order by timestamp
            return a.timestamp - b.timestamp;
        });
        $.each(list, function(index, element) {
            prependMessage(element);

        });

    },

    reloadMessages: function() {
        if (app.firebaseConnected) {
            startSpinner();
            if ($('#list-messages').is(":visible")) {

                $('#list-messages').html('');
                app.messages = [];
                readUsergroups(true);
                stopSpinner();

            } else {

                readPersonalMessages(20);
                setTimeout(function() {
                    stopSpinner();
                }, 1000);
            }
        } else {
            Materialize.toast('Connettività assente.', 4000);
        }
    },
    loadMore: function() {
        if (app.firebaseConnected) {
            startSpinner();
            if ($('#list-messages').is(":visible")) {
                
                var limit = app.messages.length + 10;
                app.messages = [];
                readMessagesOnce(limit, limit);


                startSpinner();
                setTimeout(function() {
                    app.listMessages();
                    stopSpinner();
                }, 2000);
            } else {
                readPersonalMessages(60);
                setTimeout(function() {
                    stopSpinner();
                }, 1000);

            }
        } else {
            Materialize.toast('Connettività assente.', 4000);
        }

    },

    user: {
        email: '',
        groups: {

        },
    },
    messages: [],
    inBackground: false,
    working: false,
    firebaseConnected: true,
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
    });
    initializeAutoComplete();
    var config = {
        apiKey: "AIzaSyB2pXLe-_VBb9CAcKf1pTuwxatUDhmQmSU",
        authDomain: "notifica-28460.firebaseapp.com",
        databaseURL: "https://notifica-28460.firebaseio.com",
        storageBucket: "notifica-28460.appspot.com",
        messagingSenderId: "392656636873"
    };
    firebase.initializeApp(config);
    // firebase bind of connection event
    var connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", function(snap) {
        if (snap.val() === true) {

            app.firebaseConnected = true;
        } else {

            app.firebaseConnected = false;
        }
    });
    // Controllo se l'utente è loggato, e nel caso apro la home-page
    // Nel caso di logout riposto alla pagina di login
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user)  {
            $(":mobile-pagecontainer").pagecontainer("change", '#login-page', {
                transition: "flip"
            });
        } else {
            startSpinner();
            readUsergroups(false);
            $(":mobile-pagecontainer").pagecontainer("change", '#home-page', {
                transition: "flip"
            });
            $('.user-email').html(user.email);
            stopSpinner();
        }
    });
    // Caso di chiusura applicazione
    window.onbeforeunload = function(e) {
        if (!$("#remember-me").is(':checked')) {
            firebase.auth().signOut().then(function() {
                // Sign-out successful.
            }, function(error) {
                // An error happened.
            });
        }
    };
    /**
     * SWIPE FUNCTIONS
     */
    $(document).on("swipeleft", function() {

        //$('#side-nav-button').sideNav('hide');

    });
    $(document).on("swipedown", function() {
        var id = $(':mobile-pagecontainer').pagecontainer('getActivePage').attr('id');
        var eTop = $('#home-page').offset().top; //get the offset top of the element
        if (id == 'home-page' && (eTop - $(window).scrollTop()) >= 0) {
            app.reloadMessages();
        }
        //$('#side-nav-button').sideNav('hide');

    });
    $(document).on("swiperight", function() {

        var id = $(':mobile-pagecontainer').pagecontainer('getActivePage').attr('id');
        if (id == 'home-page') {
            $('#side-nav-button').sideNav('show');
        }

    });
    /**
     * END swipe functions
     */
    /**
     * EVENT LISTNER FUNCTIONS
     */
    document.getElementById("show-personal-list").addEventListener("click", function() {
        startSpinner();
        $('#list-messages').hide();
        $('#list-personal-messages').show();
        readPersonalMessages(20);
        $('#side-nav-button').sideNav('hide');
        stopSpinner();
    });
    document.getElementById("show-messages-list").addEventListener("click", function() {
        startSpinner();
        $('#list-personal-messages').hide();
        $('#list-messages').show();
        $('#side-nav-button').sideNav('hide');
        stopSpinner();
    });
    document.getElementById("register-button").addEventListener("click", function() {
        startSpinner();
        var email = $('#email-input').val();
        var pass = $('#pass-input').val();
        var confPass = $('#confpass-input').val();
        if (email === '') {
            Materialize.toast('Devi inserire un email valida', 3000);
            stopSpinner();
            return false;
        }
        if (pass != confPass || pass === '') {
            Materialize.toast('Le due password devono corrsipondere.', 3000);
            stopSpinner();
            return false;
        }
        register(email, pass);


    });
    document.getElementById("login-button").addEventListener("click", function() {
        startSpinner();
        var email = $('#email-input-login').val();
        var pass = $('#pass-input-login').val();
        if (validateLogin(email, pass)) {

            login(email, pass);

        }
        stopSpinner();
    });
    document.getElementById("logout-button").addEventListener("click", function() {
        startSpinner();
        firebase.auth().signOut().then(function() {
            $('#list-messages').html('');
            $('#list-personal-messages').html('');
            firebase.database().goOffline();
            stopSpinner();
        }, function(error) {
            Materialize.toast('Errore connessione: ' + error, 5000);
            stopSpinner();
        });
    });
    document.getElementById("forgot-button").addEventListener("click", function() {
        startSpinner();
        var auth = firebase.auth();
        var emailAddress = $('#email-input-forgot').val();

        auth.sendPasswordResetEmail(emailAddress).then(function() {
            $('#email-input-forgot').val('');
            Materialize.toast('Email inviata!', 5000, 'rounded');
            stopSpinner();
        }, function(error) {
            Materialize.toast('Errore connessione: ' + error, 5000);
            stopSpinner();
        });
    });
    document.getElementById("send-button").addEventListener("click", sendMessage);
    document.getElementById("addGroup").addEventListener("click", function() {
        if (app.firebaseConnected) {
            startSpinner();
            var group = $('#add-group-user').val();
            if (group !== undefined && group !== null) {
                firebase.database().ref('/user_details/' + app.user.key + '/groups').push(group).then(function(snapshot) {
                    app.messages = [];
                    readUsergroups(true);

                    Materialize.toast('Gruppo aggiunto.', 3000, 'rounded');
                    stopSpinner();
                }).catch(function(error) {

                    Materialize.toast('Errore connessione: ' + error, 5000);
                    stopSpinner();
                });
            }
        } else {
            Materialize.toast('Connettività assente.', 4000);
        }

    });
    document.getElementById("deleteGroup").addEventListener("click", function() {
        if (app.firebaseConnected) {
            startSpinner();
            var key = $("#usergroups option:selected").attr('data-key');
            if (key !== undefined && key !== null) {
                firebase.database().ref('/user_details/' + app.user.key + '/groups/' + key).remove().then(function(snapshot) {
                    app.messages = [];
                    readUsergroups(true);

                    Materialize.toast('Gruppo elimninato.', 3000, 'rounded');
                    stopSpinner();
                }).catch(function(error) {

                    Materialize.toast('Errore connessione: ' + error, 5000);
                    stopSpinner();
                });
            }
        } else {
            Materialize.toast('Connettività assente.', 4000);
        }

    });
    document.getElementById("createGroup").addEventListener("click", function() {
        if (app.firebaseConnected) {
            startSpinner();
            var group = $('#new-group').val();
            if (group !== undefined && group !== null && group !== '') {
                firebase.database().ref('groups/' + group).set({
                    name: group
                }).then(function(snapshot) {
                    firebase.database().ref('/user_details/' + app.user.key + '/groups').push(group).then(function(snapshot) {
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
        } else {
            Materialize.toast('Connettività assente.', 4000);
        }

    });
    /**
     * END event EventListener functions
     */
    /**
     * PAGECHANGE BIND take picture if not taked
     */
    $(document).on("pagechange", function() {

        $('#side-nav-button').sideNav('hide');
        var id = $(':mobile-pagecontainer').pagecontainer('getActivePage').attr('id');
        if (id == 'send-message') {
            $('#user-to-send').val('');
            $('#message').val('');
            readGroups();
        } else if (id == 'home-page') {
            $('#list-personal-messages').hide();
            $('#list-messages').show();
            //listMessages();
        } else if (id == 'profile-page') {
            readGroups();
        }

    });


});


function validateLogin(email, pass) {


    if (email === '') {
        Materialize.toast('Devi inserire un email valida', 3000);
        return false;
    }
    if (pass === '') {
        Materialize.toast('La password non deve essere vuota.', 3000);
        return false;
    }

    return true;
}

function saveUserEmail(email) {
    var users = getStorage('users-email');
    if (users === false) {
        users = {
            data: {}
        };
        users.data[email] = null;
        users = JSON.stringify(users);
        setStorage('users-email', users);
    } else {
        users = JSON.parse(users);
        users.data[email] = null;
        users = JSON.stringify(users);
        setStorage('users-email', users);
    }

}


/**
 * STORAGE FUNCTIONS
 *
 */

function checkStorage() {
    if (typeof window.localStorage != undefined) {
        return true;
    } else {
        return false;
    }
}

function setStorage(name, val) {
    if (checkStorage()) {
        localStorage.setItem(name, val);
        return true;
    } else {
        return false;
    }
}

function getStorage(name) {
    var val = localStorage.getItem(name);
    if (val != undefined && val != null) {
        return val;
    } else {
        return false;
    }
}

function deleteStorage(name) {
    localStorage.removeItem(name);
}
