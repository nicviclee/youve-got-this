'use strict';

var reg; //ServiceWorkerRegistration object
var isSubscribed = false;
var subscribeButton;  // document.querySelector('button');
var serverUrl = "http://placeholder.com/";

$(document).ready(function() {
    subscribeButton = $('#subscribeButton');
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
    reg.pushManager.subscribe({userVisibleOnly: true})
    .then(function(pushSubscription) {
        console.log('Subscribed to Notification Server! Endpoint:', pushSubscription.endpoint);
        subscribeButton.prop('disabled', false);
        subscribeButton.text('Unsubscribe');
        isSubscribed = true;
        sendSubscriptionToServer(pushSubscription);
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
            return;
        }

        pushSubscription.unsubscribe().then(function(event) {
            subscribeButton.prop('disabled', false);
            subscribeButton.text('Subscribe');
            console.log('Unsubscribed!', event);
            isSubscribed = false;
            removeSubscriptionFromServer(pushSubscription);
        }).catch(function(err) {
            console.log('Error unsubscribing.', err);
            subscribeButton.textConent = 'Subscribe';
        }, 3000);
    }).catch(function(err) {
        console.error('Error thrown while getting subscription to unsubscribe.', err);
    });
}

function sendSubscriptionToServer(subscription) {
    postToAppServer('register', subscription.endpoint, function(data) {
        // Registration successful
        console.log('Registered with Application Server! Data:', data);
    });
}

function removeSubscriptionFromServer(subscription) {
    postToAppServer('unregister', subscription.endpoint, function(data) {
        // Registration successful
        console.log('Unregistered with Application Server! Data:', data);
    });
}

function postToAppServer(action, endpoint, callback) {
    $.post(serverUrl + action, endpoint, function(data) {
        // Do something
        callback(data);
    }, 'JSON');
}
