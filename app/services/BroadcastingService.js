import {
    GetStoreData,
    SetStoreData
} from '../helpers/General';

import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification from "react-native-push-notification";
import { BleManager } from 'react-native-ble-plx';

import BackgroundTimer from 'react-native-background-timer';
import UUIDGenerator from 'react-native-uuid-generator';

var instanceCount = 0;
var lastPointCount = 0;
var broadcastingInterval = 60000 * 5;  // Time (in milliseconds) between broadcasting information polls.  E.g. 60000*5 = 5 minutes
// DEBUG: Reduce Time intervall for faster debugging
// var broadcastingInterval = 5000;
var bleManager = new BleManager();
var currentUUID = "";


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

function saveMyUUID(me) {
    // Persist this contact data in our local storage of time/lat/lon values

    GetStoreData('MY_UUIDs')
        .then(myUUIDString => {
            var myUUIDArray;
            if (myUUIDArrayString !== null) {
                myUUIDArray = JSON.parse(myUUIDArrayString);
            } else {
                myUUIDArray = [];
            }

            // Always work in UTC, not the local time in the contactData
            var nowUTC = new Date().toISOString();
            var unixtimeUTC = Date.parse(nowUTC);
            var unixtimeUTC_28daysAgo = unixtimeUTC - (60 * 60 * 24 * 1000 * 28);

            // Save the contact using the current lat-lon and the
            // calculated UTC time (maybe a few milliseconds off from
            // when the GPS data was collected, but that's unimportant
            // for what we are doing.)
            lastPointCount = myUUID.length;
            console.log('[GPS] Saving myUUID:', lastPointCount);
            var lat_lon_time = {
                "uuid": me["uuid"],
                "time": unixtimeUTC
            };
            myUUID.push(lat_lon_time);

            SetStoreData('MY_UUIDs', myUUID);
        });
}

export default class BroadcastingServices {
    static start() {
        instanceCount += 1;

        BackgroundTimer.runBackgroundTimer(() => { 
            UUIDGenerator.getRandomUUID((uuid) => {
                console.log("New UUID: ", uuid);
                currentUUID = uuid;
                saveMyUUID(uuid);
            });
        }, 1000 * 60 * 60); // Every hour, change UUID

        BackgroundTimer.runBackgroundTimer(() => { 
            console.log("Making my self discoverable: ", uuid);
            makeMyselfDiscoverable();
        }, 1000 * 60 * 3); // Every 3 minutes: make myself discoverable. 

        PushNotification.configure({
            // (required) Called when a remote or local notification is opened or received
            onNotification: function(notification) {
              console.log("NOTIFICATION:", notification);
              // required on iOS only (see fetchCompletionHandler docs: https://github.com/react-native-community/react-native-push-notification-ios)
              notification.finish(PushNotificationIOS.FetchResult.NoData);
            },
            requestPermissions: true
          });

        console.log("Starting Bluetooth");

        const subscription = bleManager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                console.log(state);
                scan();
                subscription.remove();
            }
        }, true);           

        BroadcastingServices.scan();
    }

    static makeMyselfDiscoverable() {
        console.log("Making my self discoverable: ", uuid);
    }

    static scan() {
        console.log("Scanning");
        bleManager.startDeviceScan(null, null, (error, device) => {
            saveContact({uuid:'test'});
            if (error) {
                console.log("Device error:", error);
                // Handle error (scanning will be stopped automatically)
                return
            }

            console.log("Found:", device, error);

            // Check if it is a device you are looking for based on advertisement data
            // or other criteria.
            if (device.name === 'TI BLE PrivateTooth' || 
                device.name === 'PrivateTooth') {
                
                console.log("Found PrivateTooth's Code:", device);

                saveContact({uuid:'uuid'});

                // Proceed with connection.
            }
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

        console.log("Stopping Bluetooth");

        bleManager.destroy();
        BackgroundTimer.stopBackgroundTimer();
    }
}
