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

/**
 * Write the user groups badeges in the profile page
 */
function writeUserGroups(user_details) {
    $('#groups-list').html('');
    $('#usergroups').html('<option data-role="none" value="" disabled selected>Scegli un gruppo</option>');
    $.each(user_details.groups, function(index, element) {
        $('#groups-list').append('<div class="chip">' + element + '</div>');
        $('#usergroups').append('<option data-role="none" data-key="' + index + '" value="' + element + '">' + element + '</option>');
    });

}

/**
 *  Prepend written messages in the user list
 */
function prependPersonalMessage(message, index) {
    var data = (new Date(message.timestamp)).toISOString().substring(0, 19).replace('T', ' ');
    var to = '';
    if (message.group !== undefined && message.group !== '') {
        to = ' <b>Group:</b> ' + message.group;
    } else {
        to = ' <b>To:</b> ' + message.to;
    }
    $('#list-personal-messages').prepend('<li id="' + index + '" data-role="none">' +
        '<div class="collapsible-header"><i class="material-icons">email</i>' +
        '<b>Data: </b>' + data + to + ' <b>From: </b>' + message.user +
        ' <button class="waves-effect waves-light btn blue-grey" onClick="deleteMessage(\'' + index + '\')">Elimina</button></div>' +
        '<div class="collapsible-body"><p>' + message.text + '</p></div>' +
        '</li>');

}

/**
 * Prepend messages in the home page to the list
 */
function prependMessage(message) {
    var data = (new Date(message.timestamp)).toISOString().substring(0, 19).replace('T', ' ');
    var to = '';
    if (message.group !== undefined && message.group !== '') {
        to = ' <b>Group:</b> ' + message.group;
    } else {
        to = ' <b>To:</b> ' + message.to;
    }
    $('#list-messages').prepend('<li data-role="none">' +
        '<div class="collapsible-header blink" onclick="removeBlink(this)"><i class="material-icons">message</i>' +
        '<b>Data: </b>' + data + to + ' <b>From: </b>' + message.user + '</div>' +
        '<div class="collapsible-body"><p>' + message.text + '</p></div>' +
        '</li>');

}
/**
 * REMOVE BLINK
 */
function removeBlink(elem) {
    elem.classList.remove("blink");
}
/**
 * SPINNER FUNCTIONS
 */
function startSpinner() {
    $('.custom-spinner').show();
}

function stopSpinner() {
    $('.custom-spinner').hide();
}
