'use strict';

var reg; //ServiceWorkerRegistration object
var sub; //subscription
var isSubscribed = false;
var subscribeButton = document.querySelector('button');

if ('serviceWorker' in navigator) {
 console.log('Service Worker is supported');
 navigator.serviceWorker.register('sw.js').then(function() {
   return navigator.serviceWorker.ready;
 }).then(function(serviceWorkerRegistration) {
     reg = serviceWorkerRegistration;
     subscribeButton.disabled = false;
     console.log('Service Worker is ready :^)', reg);
 }).catch(function(err) {
   console.log('Service Worker Error :^(', err);
 });
}

subscribeButton.addEventListener('click', function() {
    if (isSubscribed) {
        unsubscribe();
    } else {
        subscribe();
    }
});

//Note: client gets new reg ID everytime they re-subscribe
function subscribe() { //subscribe to push messaging
    reg.pushManager.subscribe({userVisibleOnly: true}).
    then(function(pushSubscription) {
        sub = pushSubscription;
        console.log('Subscribed! Endpoint:', sub.endpoint);
        subscribeButton.textContent = 'Unsubscribe';
        isSubscribed = true;
    });
}

function unsubscribe() {
    sub.unsubscribe().then(function(event) {
        subscribeButton.textContent = 'Subscribe';
        console.log('Unsubscribed!', event);
        isSubscribed = false;
    }).catch(function(err) {
        console.log('Error unsubscribing', err);
        subscribeButton.textConent = 'Subscribe';
    });
}