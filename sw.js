'use strict';

console.log('Started', self);
self.addEventListener('install', function(event) {
  self.skipWaiting();
  console.log('Installed', event);
});

self.addEventListener('activate', function(event) {
  console.log('Activated', event);
});

self.addEventListener('push', function(event) {
  console.log('Push message', event);
  var title = 'Nicole,';
  event.waitUntil( //'until' extends lifetime of event handler until showNotification() is resolved
    self.registration.showNotification(title, {
      body: 'You\'ve got this!',
      icon: 'images/penguin.png',
      tag: 'my-tag'
    }));
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification click: tag ', event.notification.tag);
    event.notification.close();
    var url = 'https://www.google.ca/search?q=baby+penguin&espv=2&biw=965&bih=644&source=lnms&tbm=isch&sa=X&ved=0ahUKEwj6qerkiNHLAhVHymMKHYkPDDUQ_AUIBigB';
    event.waitUntil(
        clients.matchAll({
            type: 'window'
        })
        .then(function(windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus(); // focus on this window if it's already open
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url); //not yet open, open
            }
        })
    );
});