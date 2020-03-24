import {
    GetStoreData,
    SetStoreData
} from '../helpers/General';

import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification from "react-native-push-notification";

import BackgroundTimer from 'react-native-background-timer';
import UUIDGenerator from 'react-native-uuid-generator';
import Moment from 'moment';

import AndroidBLEAdvertiserModule from 'react-native-ble-advertiser'

var instanceCount = 0;
var lastPointCount = 0;
var broadcastingInterval = 60000 * 5;  // Time (in milliseconds) between broadcasting information polls.  E.g. 60000*5 = 5 minutes
// DEBUG: Reduce Time intervall for faster debugging
// var broadcastingInterval = 5000;
var currentUUID = null;

const PRIVATE_KIT_SERVICE_UUID = "C6BDEE55-7E0F-4618-B842-EFF2270E8629";

// Define a region which can be identifier + uuid,
// identifier + uuid + major or identifier + uuid + major + minor
// (minor and major properties are numbers)
var region = {
	identifier: 'PrivaateTooth',
	uuid: PRIVATE_KIT_SERVICE_UUID
};

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
        .then(myUUIDArrayString => {
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
            lastPointCount = myUUIDArray.length;
            var uuid_time = {
                "uuid": me["uuid"],
                "time": unixtimeUTC
            };
            console.log('[GPS] Saving myUUID:', Moment(unixtimeUTC).format('MMM Do, H:mma'), me["uuid"], lastPointCount);
            myUUIDArray.push(uuid_time);

            SetStoreData('MY_UUIDs', myUUIDArray);
        });
}

function loadLastUUIDAndBroadcast() {
    GetStoreData('MY_UUIDs')
        .then(myUUIDArrayString => {
            var myUUIDArray;
            if (myUUIDArrayString !== null) {
                myUUIDArray = JSON.parse(myUUIDArrayString);
                console.log("Loading last uuid ", myUUIDArray[myUUIDArray.length-1].uuid);
                currentUUID = myUUIDArray[myUUIDArray.length-1].uuid;

                console.log("Broadcasting: ", currentUUID);
                AndroidBLEAdvertiserModule.setCompanyId(0xE2);
                AndroidBLEAdvertiserModule.broadcastPacket(currentUUID, [1,2])
                .then((sucess) => {
                    console.log("Sucessful", sucess);
                }).catch(error => console.log(error));
            } else {
                generateNewUUID();
            }
        });
}

function generateNewUUID() {
    UUIDGenerator.getRandomUUID((uuid) => {
        currentUUID = uuid;
        saveMyUUID({'uuid':uuid});
    });
}

export default class BroadcastingServices {
    static start() {
        loadLastUUIDAndBroadcast();

        instanceCount += 1;

        BackgroundTimer.runBackgroundTimer(() => { 
            generateNewUUID();
        }, 1000 * 60 * 60); // Every hour, change UUID

        //BackgroundTimer.runBackgroundTimer(() => { 
        //    
        //}, 1000 * 60 * 3); // Every 3 minutes: make myself discoverable. 

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


        BackgroundTimer.stopBackgroundTimer();
    }
}
