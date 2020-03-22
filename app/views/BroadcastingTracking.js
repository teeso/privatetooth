import React, {
    Component
} from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Linking,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Image,
    ScrollView,
    BackHandler,
    Button,
    FlatList 
} from 'react-native';
import colors from "../constants/colors";
import BroadcastingServices from '../services/BroadcastingService';
import Moment from 'moment';

import pkLogo from './../assets/images/PKLogo.png';

import {GetStoreData, SetStoreData} from '../helpers/General';
import languages from './../locales/languages'

const width = Dimensions.get('window').width;

class BroadcastingTracking extends Component {
    constructor(props) {
        super(props);
        Moment.locale('en');

        this.state = {
            isLogging:'',
            contacts: []
        }
    }

    componentDidMount() {
        BackHandler.addEventListener("hardwareBackPress", this.handleBackPress); 
        
        GetStoreData('CONTACT_DATA')
        .then(contactArrayString => {
            if (contactArrayString !== null) {
                var contactArray = JSON.parse(contactArrayString);
                var curated = [];
                console.log("Preparing to View ", contactArray);
                for (var i = 0; i < contactArray.length; i++) {
                    curated.push({
                         key: contactArray[i].uuid + "-"+ contactArray[i].time, 
                        uuid: contactArray[i].uuid, 
                        time: contactArray[i].time,
                        timeStr: Moment(contactArray[i].time).format('MMM Do, H:mma')
                    });
                }

                console.log("Sending to View ", curated);
                this.setState({contacts: curated});
            } else {
                this.setState({contacts: []});
            }
            
        })
        .catch(error => console.log(error))

        GetStoreData('PARTICIPATE')
        .then(isParticipating => {   
            if(isParticipating === 'true'){
                this.setState({
                    isLogging:true
                })
                this.willParticipate()
            }
            else{
                this.setState({
                    isLogging:false
                }) 
            }
        })
        .catch(error => console.log(error))
    }
    componentWillUnmount() {     BackHandler.removeEventListener("hardwareBackPress", this.handleBackPress);   }   

    handleBackPress = () => {     
        BackHandler.exitApp(); // works best when the goBack is async     
        return true;   
    };   
    export() {
        
    }

    import() {
        
    }

    news() {
        
    }

    willParticipate =()=> {
        SetStoreData('PARTICIPATE', 'true').then(() =>
            BroadcastingServices.start()
        );
        this.setState({
            isLogging:true
        })
    }

    setOptOut =()=>{
        BroadcastingServices.stop(this.props.navigation)
        this.setState({
            isLogging:false
        })
    }

    render() {
        return (
            <SafeAreaView style={styles.container} >

                <ScrollView contentContainerStyle={styles.main}>
                    <View style={styles.topView}>
                        <View style={styles.intro} >

                            <Text style={styles.headerTitle}>{languages.t('label.private_kit')}</Text>

                            {
                                this.state.isLogging  ? (
                                    <>
                                    <Image source={pkLogo} style={{width:132,height:164.4,alignSelf:'center',marginTop:12}} />

                                <TouchableOpacity onPress={() => this.setOptOut()} style={styles.stopLoggingButtonTouchable} >
                                <Text style={styles.stopLoggingButtonText}>{languages.t('label.stop_logging')}</Text>
                                </TouchableOpacity>
                                </>
                                ) : ( 
                                <>
                                <Image source={pkLogo} style={{width:132,height:164.4,alignSelf:'center',marginTop:12,opacity:.3}} />
                                <TouchableOpacity onPress={() => this.willParticipate()} style={styles.startLoggingButtonTouchable} >
                                    <Text style={styles.startLoggingButtonText}>{languages.t('label.start_logging')}</Text>
                                </TouchableOpacity>
                                </>)
                            }

                           {this.state.isLogging ?  
                            <Text style={styles.sectionDescription}>{languages.t('label.logging_message')}</Text> :
                            <Text style={styles.sectionDescription}>{languages.t('label.not_logging_message')}</Text> }
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.listPastConnections}>
                    <Text style={styles.subHeaderTitle}>Last Contacts</Text>
                    <FlatList
                        data={ this.state.contacts }
                        renderItem={({item}) => <Text style={styles.itemPastConnections}>{item.timeStr}: {item.uuid}</Text>}
                        />

                </View>

                <View style={styles.footer}>
                    <Text style={[styles.sectionDescription, { textAlign: 'center', paddingTop: 15 }]}>{languages.t('label.url_info')} </Text>
                    <Text style={[styles.sectionDescription, { color: 'blue', textAlign: 'center',marginTop:0 }]} onPress={() => Linking.openURL('https://privatekit.mit.edu')}>{languages.t('label.private_kit_url')}</Text>
                </View>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    // Container covers the entire screen
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: colors.PRIMARY_TEXT,
        backgroundColor: colors.WHITE,
    },
    listPastConnections: {
        width: "80%",
        height: 200
    },
    itemPastConnections: {
        padding: 3
    },
    headerTitle: {
        textAlign: 'center',
        fontSize: 38,
        padding: 0,
        fontFamily:'OpenSans-Bold'
    },
    subHeaderTitle: {
        textAlign: 'center',
        fontWeight: "bold",
        fontSize: 22,
        padding: 5
    },
    main: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: "80%"
    },
    block: {
        margin: 20,
        width: "100%"
    },
    footer: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingBottom: 10
    },
    intro: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
    },
    sectionDescription: {
        fontSize: 12,
        lineHeight: 24,
        fontFamily:'OpenSans-Regular',
        marginTop: 20,
        marginLeft: 10,
        marginRight: 10
    },
    startLoggingButtonTouchable:{
        borderRadius: 12,
        backgroundColor: "#665eff",
        height:52,
        alignSelf:'center',
        width:width*.7866,
        marginTop:30,
        justifyContent:'center'
    },
    startLoggingButtonText:{
        fontFamily: "OpenSans-Bold",
        fontSize: 14,
        lineHeight: 19,
        letterSpacing: 0,
        textAlign: "center",
        color: "#ffffff"
    },
    stopLoggingButtonTouchable:{
        borderRadius: 12,
        backgroundColor: "#fd4a4a",
        height:52,
        alignSelf:'center',
        width:width*.7866,
        marginTop:30,
        justifyContent:'center',
    },
    stopLoggingButtonText:{
        fontFamily: "OpenSans-Bold",
        fontSize: 14,
        lineHeight: 19,
        letterSpacing: 0,
        textAlign: "center",
        color: "#ffffff"
    },
    actionButtonsView:{
        width:width*.7866,
        flexDirection:'row',
        justifyContent:'space-between',
        marginTop:64
    },
    actionButtonsTouchable:{
        height: 76,
        borderRadius: 8,
        backgroundColor: "#454f63",
        width:width*.23,
        justifyContent:'center',
        alignItems:'center'
    },
    actionButtonImage:{
        height:21.6,
        width:32.2
    },
    actionButtonText:{
        opacity: 0.56,
        fontFamily: "OpenSans-Bold",
        fontSize: 12,
        lineHeight: 17,
        letterSpacing: 0,
        textAlign: "center",
        color: "#ffffff",
        marginTop:6
    }
});

export default BroadcastingTracking;
