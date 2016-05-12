'use strict';

var reg; //ServiceWorkerRegistration object
var isSubscribed = false;
var subscribeButton;  // document.querySelector('button');
var nameInput;
//var serverUrl = "http://placeholder.com/";
var SERVER_URL = "http://youvegotthis.herokuapp.com/server";
var DEFAULT_NAME = 'Friend';

function User(subscription, name) {
    this.subscription = subscription;
    this.name = name;
}

$(document).ready(function() {
    subscribeButton = $('#subscribeButton');
    nameInput = $('#userName');
    console.log(subscribeButton);
    if ('serviceWorker' in navigator) {
        console.log('Service Worker is supported');
        navigator.serviceWorker.register('sw.js').then(function() {
            return navigator.serviceWorker.ready;
        }).then(function(serviceWorkerRegistration) {
            reg = serviceWorkerRegistration;
            subscribeButton.prop('disabled', false);
            console.log('Service Worker is ready :^)', reg);
            initialiseState();
        }).catch(function(err) {
            console.log('Service Worker Error :^(', err);
        });
    } else {
        console.warn("Service workers aren't supported in this browser.");
    }

    subscribeButton.click(function() {
        console.log('Subscribe button clicked.');
        if (isSubscribed) {
            unsubscribe();
        } else {
            subscribe();
        }
    });
});

function initialiseState() {
  // Are Notifications supported in the service worker?
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
    console.warn('Notifications aren\'t supported.');
    return;
  }

  // Check the current Notification permission.
  // If its denied, it's a permanent block until the
  // user changes the permission
  if (Notification.permission === 'denied') {
    console.warn('The user has blocked notifications.');
    return;
  }

  // Check if push messaging is supported
  if (!('PushManager' in window)) {
    console.warn('Push messaging isn\'t supported.');
    return;
  }

  // We need the service worker registration to check for a subscription
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // Do we already have a push message subscription?
    serviceWorkerRegistration.pushManager.getSubscription()
      .then(function(subscription) {
        // Enable any UI which subscribes / unsubscribes from
        // push messages.
        subscribeButton.prop('disabled', false);

        if (!subscription) {
          // We aren't subscribed to push, so set UI
          // to allow the user to enable push
          return;
        }

        // Keep your server in sync with the latest subscriptionId
        sendSubscriptionToServer(subscription);

        // Set your UI to show they have subscribed for
        // push messages
        subscribeButton.text('Unsubscribe');
        isSubscribed = true;
      })
      .catch(function(err) {
        console.warn('Error during getSubscription()', err);
      });
  });
}

//Note: client gets new reg ID everytime they re-subscribe
function subscribe() { //subscribe to push messaging
    console.log('Subscribing.');
    subscribeButton.prop('disabled', true);
    nameInput.prop('disabled', true);
    reg.pushManager.subscribe({userVisibleOnly: true})
    .then(function(pushSubscription) {
        console.log('Subscribed to Notification Server! Endpoint:', pushSubscription.endpoint);
        subscribeButton.prop('disabled', false);
        subscribeButton.text('Unsubscribe');
        isSubscribed = true;
        var name = nameInput.val();
        if (!name.trim() || name === undefined) {
            console.log('Using default name.');
            name = DEFAULT_NAME;
            nameInput.val(name);
        }
        var user = new User(pushSubscription, name);
        sendSubscriptionToServer(user);
    }).catch(function(error) {
        // During development it often helps to log errors to the
        // console. In a production environment it might make sense to
        // also report information about errors back to the
        // application server.
        console.log('Error subscribing.', error);
    });
}

function unsubscribe() {
    subscribeButton.prop('disabled', true);
    reg.pushManager.getSubscription().then(function(pushSubscription) {
        if (!pushSubscription) {
            isSubscribed = false;
            subscribeButton.prop('disabled', false);
            subscribeButton.text('Subscribe');
            nameInput.prop('disabled', false);
            return;
        }

        pushSubscription.unsubscribe().then(function(event) {
            subscribeButton.prop('disabled', false);
            subscribeButton.text('Subscribe');
            nameInput.prop('disabled', false);
            console.log('Unsubscribed!', event);
            isSubscribed = false;
            var name = nameInput.val();
            var user = new User(pushSubscription, name);
            removeSubscriptionFromServer(user);
        }).catch(function(err) {
            console.log('Error unsubscribing.', err);
            subscribeButton.prop('disabled', false);
            subscribeButton.text('Subscribe');
            nameInput.prop('disabled', false);
        }, 3000);
    }).catch(function(err) {
        subscribeButton.prop('disabled', false);
        subscribeButton.text('Subscribe');
        nameInput.prop('disabled', false);
        console.error('Error thrown while getting subscription to unsubscribe.', err);
    });
}

function sendSubscriptionToServer(user) {
    console.log('User: ' + JSON.stringify(user));
    postToAppServer('register', JSON.stringify(user), function(data) {
        // Registration successful
        console.log('Registered with Application Server! Data:', data);
    });
}

function removeSubscriptionFromServer(user) {
    postToAppServer('unregister', JSON.stringify(user), function(data) {
        // Registration successful
        console.log('Unregistered with Application Server! Data:', data);
    });
}

function postToAppServer(action, info, callback) {
    $.post(SERVER_URL + action, info, function(data) {
        // Do something
        callback(data);
    }, 'JSON');
}
