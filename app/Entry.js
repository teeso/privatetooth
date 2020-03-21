import React, {Component } from 'react';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaView} from 'react-native';
import BroadcastingTracking from './views/BroadcastingTracking';
import Welcome from './views/Welcome';
import Slider from './views/WelcomeScreens/Slider';
import {GetStoreData, SetStoreData} from './helpers/General';

const Stack = createStackNavigator();

class Entry extends Component {
    constructor(props) {
        super(props);
        this.state={
          initialRouteName:''
        }
    }

    componentDidMount(){
      GetStoreData('PARTICIPATE')
      .then(isParticipating => {
          console.log(isParticipating);
              this.setState({
                initialRouteName:isParticipating
              })
      })
      .catch(error => console.log(error))
    }

    render() {
      return (
        <NavigationContainer>
          <SafeAreaView style={{flex:1}}>
          <Stack.Navigator initialRouteName='InitialScreen'>
            {this.state.initialRouteName === 'true' ? (
              <Stack.Screen
              name="InitialScreen"
              component={BroadcastingTracking}
              options={{headerShown:false}}
                />
            ):(
              <Stack.Screen
              name="InitialScreen"
              component={Slider}
              options={{headerShown:false}}
                />
            )}
          <Stack.Screen
              name="Slider"
              component={Slider}
              options={{headerShown:false}}
                />
            <Stack.Screen
              name="WelcomeScreen"
              component={Welcome}
              options={{headerShown:false}}
                />
            <Stack.Screen
              name="BroadcastingTrackingScreen"
              component={BroadcastingTracking}
              options={{headerShown:false}}
            />
          </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      )
    }
}

export default Entry;
