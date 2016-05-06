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
    var obj = event.data.json();
    var title = obj.title;
    var message = obj.message;
    var icon = '/images/penguin.png';
    var notificationTag = "youve-got-this-tag";
    event.waitUntil( //'until' extends lifetime of event handler until showNotification() is resolved
        self.registration.showNotification(title, {
            body: message,
            icon: icon,
            tag: notificationTag
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification click: tag ', event.notification.tag);
    event.notification.close();
    // TODO: change the url to something interesting. Google I'm feeling lucky on the message?
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
