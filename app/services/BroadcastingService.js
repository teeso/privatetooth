import {
    GetStoreData,
    SetStoreData
} from '../helpers/General';

import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification from "react-native-push-notification";

var instanceCount = 0;
var lastPointCount = 0;
var broadcastingInterval = 60000 * 5;  // Time (in milliseconds) between broadcasting information polls.  E.g. 60000*5 = 5 minutes
// DEBUG: Reduce Time intervall for faster debugging
// var broadcastingInterval = 5000;

function saveContact(contact) {
    // Persist this contact data in our local storage of time/lat/lon values

    GetStoreData('CONTACT_DATA')
        .then(contactArrayString => {

            var contactArray;
            if (contactArrayString !== null) {
                contactArray = JSON.parse(contactArrayString);
            } else {
                contactArray = [];
            }

            // Always work in UTC, not the local time in the contactData
            var nowUTC = new Date().toISOString();
            var unixtimeUTC = Date.parse(nowUTC);
            var unixtimeUTC_28daysAgo = unixtimeUTC - (60 * 60 * 24 * 1000 * 28);

            // Save the contact using the current lat-lon and the
            // calculated UTC time (maybe a few milliseconds off from
            // when the GPS data was collected, but that's unimportant
            // for what we are doing.)
            lastPointCount = contactArray.length;
            console.log('[GPS] Saving point:', lastPointCount);
            var lat_lon_time = {
                "uuid": contact["uuid"],
                "time": unixtimeUTC
            };
            contactArray.push(lat_lon_time);

            SetStoreData('CONTACT_DATA', contactArray);
        });
}

export default class BroadcastingServices {
    static start() {
        instanceCount += 1

        PushNotification.configure({
            // (required) Called when a remote or local notification is opened or received
            onNotification: function(notification) {
              console.log("NOTIFICATION:", notification);
              // required on iOS only (see fetchCompletionHandler docs: https://github.com/react-native-community/react-native-push-notification-ios)
              notification.finish(PushNotificationIOS.FetchResult.NoData);
            },
            requestPermissions: true
          });
    }

    static getPointCount() {
        return lastPointCount;
    }

    static stop(nav) {
        // unregister all event listeners
        PushNotification.localNotification({
            title: "Broadcasting Was Disabled",
            message: "Private Kit requires broadcasting services."
        });
        instanceCount -= 1;
        SetStoreData('PARTICIPATE', 'false').then(() =>
            nav.navigate('BroadcastingTrackingScreen', {})
        )
    }
}
