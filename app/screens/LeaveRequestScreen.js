import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { SkypeIndicator, WaveIndicator } from 'react-native-indicators';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

import { CURRENT_HOST } from '../config/config';
import HeaderNav from '../components/HeaderNav';
import CustomAlert from '../components/CustomAlert';

export default function LeaveRequestScreen({ navigation, userToken, setUserToken, userData }) {
    const [pageLoading, setPageLoading] = useState(false);
    const [leaveReasons, setLeaveReasons] = useState([]);
    const [leaveAllocation, setLeaveAllocation] = useState('');
    const [type, setType] = useState('');
    const [reason, setReason] = useState('');
    const [detail, setDetail] = useState('');
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(false);
    const [res, setRes] = useState({
        message: 'Leave has been applied',
        status: 'Success !'
    });

    const [datePickerEnabled, setDatePickerEnabled] = useState(false);
    const [dateFrom, setDateFrom] = useState(new Date());
    const [dateFromCheck, setDateFromCheck] = useState(false);
    const [dateTo, setDateTo] = useState(new Date());
    const [dateToCheck, setDateToCheck] = useState(false);
    const [mode1, setMode1] = useState('date');
    const [mode2, setMode2] = useState('date');
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);

    const [error, setError] = useState({
        leaveErr: false,
        typeErr: false,
        reasonErr: false,
        dateFromErr: false,
        dateToErr: false,
        datePickerErr: false
    });

    const { t } = useTranslation();
    const { selectedLanguage } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setPageLoading(true);

                const axiosConfig = {
                    headers: {
                        'Authorization': `bearer ${userToken}`,
                    },
                };

                const response = await axios.post(`${CURRENT_HOST}/api/employee/leavereasons/${userData.employeeID}`, null, axiosConfig);
                setLeaveReasons(response.data);
            }
            catch (error) {
                console.log(error);
                setTimeout(() => {
                    setUserToken(null);
                }, 2000);
            }
            finally {
                setTimeout(() => {
                    setPageLoading(false);
                }, 1200)
            }
        };

        fetchData();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setDatePickerEnabled(false);
            setDateFromCheck(false);
            setDateToCheck(false);
            setLeaveAllocation('');
            setType('');
            setReason('');
            setDetail('');
            setDocument(null);
            setLoading(false);
            setAlert(false);
            setError(prevState => ({
                ...prevState,
                leaveErr: false,
                typeErr: false,
                reasonErr: false,
                dateFromErr: false,
                dateToErr: false,
                datePickerErr: false
            }));
        }, [])
    );

    const pickDocument = async () => {
        let result = await DocumentPicker.getDocumentAsync({});
        setDocument(result);
    };

    const onChange1 = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShow1(false);
        setDateFrom(currentDate);
        setDatePickerEnabled(true);
        setError(prevState => ({ ...prevState, datePickerErr: false }));
    };

    const onChange2 = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShow2(false);
        setDateTo(currentDate);
    };

    const showMode1 = (currentMode) => {
        setShow1(true);
        setMode1(currentMode);
    };

    const showMode2 = (currentMode) => {
        setShow2(true);
        setMode2(currentMode);
    };

    const showDatepicker1 = () => {
        showMode1('date');
    };

    const showDatepicker2 = () => {
        showMode2('date');
    };

    const toggleAlert = () => {
        setAlert(!alert);
    };

    function convertISODateToFormattedDate(isoDate) {
        const dateObject = new Date(isoDate);
        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, "0");
        const day = String(dateObject.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    function convertISODateToDateTime(isoDate) {
        return new Date(isoDate);
    };

    const handleSubmit = async () => {
        if (leaveAllocation === '' || type === '' || reason === '' || datePickerEnabled === false) {
            if (leaveAllocation === '') {
                setError(prevState => ({ ...prevState, leaveErr: true }));
            }
            if (type === '') {
                setError(prevState => ({ ...prevState, typeErr: true }));
            }
            if (reason === '') {
                setError(prevState => ({ ...prevState, reasonErr: true }));
            }
            if (datePickerEnabled === false) {
                setError(prevState => ({ ...prevState, datePickerErr: true }));
            }
        }

        else {
            try {
                setLoading(true);

                const leaveRequestData = {
                    leaveTypeId: type,
                    fromDate: convertISODateToDateTime(convertISODateToFormattedDate(dateFrom)),
                    toDate: convertISODateToDateTime(convertISODateToFormattedDate(dateTo)),
                    leaveReasonId: reason,
                    reasonDetail: detail === '' || detail === ' ' ? null : detail,
                    attachment: document !== null ? document.assets[0].uri : null
                };

                const axiosConfig = {
                    headers: {
                        'Authorization': `bearer ${userToken}`,
                    },
                };

                await axios.post(`${CURRENT_HOST}/api/employee/leaverequest/${userData.employeeID}`, leaveRequestData, axiosConfig)
                    .then(response => {
                        console.log('Leave request created:', response.data);
                    })
                    .catch(error => {
                        console.error('Error creating leave request:', error);
                        setRes(prevState => ({
                            ...prevState,
                            message: 'Error sending leave request',
                            status: 'Failed !',
                        }));
                    });

                setTimeout(() => {
                    setLoading(false);
                    toggleAlert();
                }, 1500)

                setDatePickerEnabled(false);
                setDateFromCheck(false);
                setDateToCheck(false);
                setLeaveAllocation('');
                setType('');
                setReason('');
                setDetail('');
                setDocument(null);
                setError(prevState => ({
                    ...prevState,
                    leaveErr: false,
                    typeErr: false,
                    reasonErr: false,
                    dateFromErr: false,
                    dateToErr: false,
                    datePickerErr: false
                }));
            }
            catch (e) {
                console.log(e);
                setTimeout(() => {
                    setUserToken(null);
                }, 2000);
            }
        }
    };

    return (
        <>
            <View style={{ flex: 1, backgroundColor: '#f6f6f6' }}>

                <View style={{ backgroundColor: 'rgba(220,224,241,0.95)', elevation: 10, shadowColor: 'gray', zIndex: 1000 }}>
                    <HeaderNav from='leave' label={t('leaverequest.leave-request')} picture={userData.picture} accessGroup={userData.accessGroup} navigation={navigation} />
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={{ marginTop: selectedLanguage === 'ar' ? 27 : 26, marginHorizontal: 25 }}>

                        {selectedLanguage !== 'ar' ? (<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18, marginLeft: 4 }}>
                            <AntDesign name="mail" size={16.5} color="#2b4757" />
                            <Text style={{ fontSize: 14, fontWeight: 700, color: '#2b4757', marginLeft: 7 }}>{t('leaverequest.heading')}</Text>
                        </View>)
                            :
                            (<View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 18, marginRight: 7 }}>
                                <Text style={{ fontSize: 14, fontWeight: 700, color: '#2b4757', marginRight: 7 }}>{t('leaverequest.heading')}</Text>
                                <AntDesign name="mail" size={16.5} color="#2b4757" />
                            </View>)}

                        <View style={{ backgroundColor: 'white', paddingTop: 18, paddingBottom: 26, alignSelf: 'center', borderRadius: 5, elevation: 1.5, shadowColor: 'gray', width: '100%' }}>
                            <View style={{ width: '87%', height: 38, marginTop: 8, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, alignSelf: 'center', justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Picker
                                        mode='dropdown'
                                        style={{ width: '100%', color: 'gray' }}
                                        selectedValue={leaveAllocation}
                                        dropdownIconColor={error.leaveErr ? 'white' : 'gray'}
                                        numberOfLines={1}
                                        onValueChange={(itemValue, itemIndex) => {
                                            setLeaveAllocation(itemValue);
                                            setError(prevState => ({ ...prevState, leaveErr: false }));
                                        }}>
                                        <Picker.Item style={{ fontSize: 13.2, color: 'gray' }} label={t('leaverequest.leave-or-allocation')} value="" />
                                        <Picker.Item label={t('leaverequest.apply-for-leave')} value='leave' style={{ fontSize: 13 }} />
                                        <Picker.Item label={t('leaverequest.apply-for-allocation')} value='allocation' style={{ fontSize: 13 }} />
                                    </Picker>
                                    {error.leaveErr && <MaterialIcons style={{ right: 30, top: 16 }} name="error-outline" size={14} color="red" />}
                                </View>
                            </View>

                            <View style={{ width: '87%', height: 38, marginTop: 13, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, alignSelf: 'center', justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Picker
                                        mode='dropdown'
                                        style={{ width: '100%', color: 'gray' }}
                                        selectedValue={type}
                                        dropdownIconColor={error.typeErr ? 'white' : 'gray'}
                                        numberOfLines={1}
                                        onValueChange={(itemValue, itemIndex) => {
                                            setType(itemValue);
                                            setError(prevState => ({ ...prevState, typeErr: false }));
                                        }}>
                                        <Picker.Item style={{ fontSize: 13.2, color: 'gray' }} label={t('leaverequest.leave-allocation-type')} value="" />
                                        <Picker.Item label={t('leaverequest.casual')} value='2' style={{ fontSize: 13 }} />
                                        <Picker.Item label={t('leaverequest.medical')} value='1' style={{ fontSize: 13 }} />
                                        <Picker.Item label={t('leaverequest.earned')} value='3' style={{ fontSize: 13 }} />
                                    </Picker>
                                    {error.typeErr && <MaterialIcons style={{ right: 30, top: 16 }} name="error-outline" size={14} color="red" />}
                                </View>
                            </View>

                            <View style={{ width: '87%', height: 38, marginTop: 13, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, alignSelf: 'center', justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Picker
                                        mode='dropdown'
                                        style={{ width: '100%', color: 'gray' }}
                                        selectedValue={reason}
                                        dropdownIconColor={error.reasonErr ? 'white' : 'gray'}
                                        numberOfLines={1}
                                        onValueChange={(itemValue, itemIndex) => {
                                            setReason(itemValue);
                                            setError(prevState => ({ ...prevState, reasonErr: false }));
                                        }}>
                                        <Picker.Item style={{ fontSize: 13.2, color: 'gray' }} label={t('leaverequest.reason')} value="" />
                                        {leaveReasons.map((reason, index) => (
                                            <Picker.Item
                                                key={index.toString()}
                                                label={reason.LeaveReasonText}
                                                value={reason.Id}
                                                style={{ fontSize: selectedLanguage === 'ar' ? 12.2 : 13, color: 'black' }}
                                            />
                                        ))}
                                    </Picker>
                                    {error.reasonErr && <MaterialIcons style={{ right: 30, top: 16 }} name="error-outline" size={14} color="red" />}
                                </View>
                            </View>
                        </View>

                        <View style={{ width: '90%', alignSelf: 'center', borderWidth: 0.5, borderColor: '#00BFFF', borderStyle: 'dashed', marginTop: 16 }} />

                        {alert && <CustomAlert msg1={res.message} msg2={res.status} alert2={alert} toggleAlert2={toggleAlert} opt='applyleave' />}

                        <View style={{ backgroundColor: 'white', marginTop: 16, paddingTop: 5, paddingBottom: 20, alignSelf: 'center', borderRadius: 5, elevation: 1.5, shadowColor: 'gray', width: '100%' }}>

                            <View style={{ width: '87%', height: 38, marginTop: 15, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, alignSelf: 'center', justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row', width: '100%' }}>
                                    <TextInput placeholder={t('leaverequest.detail')} placeholderTextColor='gray' style={{ fontSize: selectedLanguage === 'ar' ? 12.5 : 13, paddingHorizontal: 17, width: '100%' }} value={detail} onSubmitEditing={() => { Keyboard.dismiss; }} blurOnSubmit={true} onChangeText={(text) => { setDetail(text.toString()) }} />
                                </View>
                            </View>

                            {selectedLanguage !== 'ar' ? (<TouchableOpacity style={{ width: '87%', height: 38, marginTop: 13, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, alignSelf: 'center', flexDirection: 'row' }} onPress={() => pickDocument()}>
                                <View style={{ backgroundColor: '#E0FFFF', width: 95, borderRadius: 5, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', paddingHorizontal: 17, color: '#2a52be', top: -1 }}>{t('leaverequest.choose-file')}</Text>
                                </View>
                                <View style={{ justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, fontWeight: '400', paddingHorizontal: 12, color: '#213440' }}>{document === null ? t('leaverequest.no-file-selected') : t('leaverequest.file-selected')}</Text>
                                </View>
                            </TouchableOpacity>)
                                :
                                (<TouchableOpacity style={{ width: '87%', height: 38, marginTop: 13, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between' }} onPress={() => pickDocument()}>
                                    <View style={{ justifyContent: 'center', left: 40 }}>
                                        <Text style={{ fontSize: 12, fontWeight: '400', paddingHorizontal: 12, color: '#213440' }}>{document === null ? t('leaverequest.no-file-selected') : t('leaverequest.file-selected')}</Text>
                                    </View>
                                    <View style={{ backgroundColor: '#E0FFFF', width: 95, borderRadius: 5, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', paddingHorizontal: 17, color: '#2a52be', top: -1 }}>{t('leaverequest.choose-file')}</Text>
                                    </View>
                                </TouchableOpacity>)}

                        </View>

                        <View style={{ width: '90%', alignSelf: 'center', borderWidth: 0.5, borderColor: '#00BFFF', borderStyle: 'dashed', marginTop: 16 }} />

                        <View style={{ backgroundColor: 'white', marginTop: 16, paddingTop: 10, paddingBottom: 25, alignSelf: 'center', borderRadius: 5, elevation: 1.5, shadowColor: 'gray', width: '100%' }}>

                            {selectedLanguage !== 'ar' ? (<View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 5 }}>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', width: '42%', height: 38, marginTop: 15, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, justifyContent: 'flex-start' }} onPress={() => {
                                    showDatepicker1();
                                    setDateFromCheck(true);
                                }}>
                                    <AntDesign name="calendar" size={16} color="#D17842" style={{ marginLeft: 15 }} />
                                    <Text style={{ fontSize: dateFromCheck ? 11.2 : 12, color: '#213440', marginLeft: 7 }}>{dateFromCheck ? dateFrom.toLocaleDateString() : t('leaverequest.date-from')}</Text>
                                    {error.datePickerErr && <MaterialIcons style={{ left: 9, top: 0.5 }} name="error-outline" size={13} color="red" />}
                                </TouchableOpacity>

                                {show1 && (
                                    <DateTimePicker
                                        testID="dateTimePicker1"
                                        value={dateFrom}
                                        mode={mode1}
                                        is24Hour={true}
                                        onChange={onChange1}
                                        minimumDate={new Date()}
                                    />
                                )}

                                <TouchableOpacity style={{ flexDirection: 'row', width: '42%', height: 38, marginTop: 15, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, justifyContent: 'flex-start', alignItems: 'center' }} onPress={() => {
                                    showDatepicker2();
                                    datePickerEnabled && setDateToCheck(true);
                                    !datePickerEnabled && setError(prevState => ({ ...prevState, datePickerErr: true }));
                                }}>
                                    <AntDesign name="calendar" size={16} color="#D17842" style={{ marginLeft: 15 }} />
                                    <Text style={{ fontSize: dateToCheck ? 11.2 : 12, color: '#213440', marginLeft: 7, width: '100%' }}>{dateToCheck ? dateTo.toLocaleDateString() : t('leaverequest.date-to')}</Text>
                                </TouchableOpacity>

                                {datePickerEnabled && show2 && (
                                    <DateTimePicker
                                        testID="dateTimePicker2"
                                        value={dateTo}
                                        mode={mode2}
                                        is24Hour={true}
                                        onChange={onChange2}
                                        minimumDate={dateFrom}
                                    />
                                )}
                            </View>)
                                :
                                (<View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 5 }}>
                                    <TouchableOpacity style={{ flexDirection: 'row', width: '42%', height: 38, marginTop: 15, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, justifyContent: 'flex-end', alignItems: 'center' }} onPress={() => {
                                        showDatepicker2();
                                        datePickerEnabled && setDateToCheck(true);
                                        !datePickerEnabled && setError(prevState => ({ ...prevState, datePickerErr: true }));
                                    }}>
                                        <Text style={{ fontSize: dateToCheck ? 11.5 : 12, color: '#213440', marginRight: 7 }}>{dateToCheck ? dateTo.toLocaleDateString() : t('leaverequest.date-to')}</Text>
                                        <AntDesign name="calendar" size={16} color="#D17842" style={{ marginRight: 15 }} />
                                    </TouchableOpacity>

                                    {datePickerEnabled && show2 && (
                                        <DateTimePicker
                                            testID="dateTimePicker2"
                                            value={dateTo}
                                            mode={mode2}
                                            is24Hour={true}
                                            onChange={onChange2}
                                            minimumDate={dateFrom}
                                        />
                                    )}

                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', width: '42%', height: 38, marginTop: 15, borderColor: 'gray', borderWidth: 0.35, borderRadius: 4, justifyContent: 'flex-end' }} onPress={() => {
                                        showDatepicker1();
                                        setDateFromCheck(true);
                                    }}>
                                        {error.datePickerErr && <MaterialIcons style={{ right: 9, top: 0.5 }} name="error-outline" size={13} color="red" />}
                                        <Text style={{ fontSize: dateFromCheck ? 11.5 : 12, color: '#213440', marginRight: 7 }}>{dateFromCheck ? dateFrom.toLocaleDateString() : t('leaverequest.date-from')}</Text>
                                        <AntDesign name="calendar" size={16} color="#D17842" style={{ marginRight: 15 }} />
                                    </TouchableOpacity>

                                    {show1 && (
                                        <DateTimePicker
                                            testID="dateTimePicker1"
                                            value={dateFrom}
                                            mode={mode1}
                                            is24Hour={true}
                                            onChange={onChange1}
                                            minimumDate={new Date()}
                                        />
                                    )}
                                </View>)}

                            <View style={{ marginTop: 22 }}>
                                {selectedLanguage !== 'ar' ? (<TouchableOpacity style={{ backgroundColor: '#00308F', padding: 9, borderRadius: 5, alignItems: 'center', width: '87%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} onPress={() => handleSubmit()}>
                                    <AntDesign name="login" size={12} color="white" style={{ left: -1 }} />
                                    <Text style={{ color: 'white', fontSize: 12.2, fontWeight: '500', marginLeft: 7, left: -2 }}>{t('leaverequest.apply')}</Text>
                                </TouchableOpacity>)
                                    :
                                    (<TouchableOpacity style={{ backgroundColor: '#00308F', padding: 10, borderRadius: 5, alignItems: 'center', width: '87%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} onPress={() => handleSubmit()}>
                                        <Text style={{ color: 'white', fontSize: 13, marginRight: 7, left: 1 }}>{t('leaverequest.apply')}</Text>
                                        <AntDesign name="login" size={13} color="white" style={{ left: 1 }} />
                                    </TouchableOpacity>)}
                            </View>

                        </View>

                    </View>
                </ScrollView>

                {loading && (
                    <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', zIndex: 5000, justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <View style={{ alignItems: 'center', top: -20 }}>
                            <SkypeIndicator color="#ffffff" size={42} />
                        </View>
                    </View>
                )}

                {pageLoading && (<View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(30, 70, 150, 0.8)', zIndex: 5000, justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                    {selectedLanguage === 'ar' ? (<View style={{ alignItems: 'center', top: -13 }}>
                        <WaveIndicator color="#ffffff" size={50} />
                        <View style={{ top: -337, alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>{t('loading.getting-things-ready')} !</Text>
                            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13.5, top: 5, left: -1 }}>{t('loading.please-wait')} ....</Text>
                        </View>
                    </View>)
                        :
                        (<View style={{ alignItems: 'center', top: -10 }}>
                            <WaveIndicator color="#ffffff" size={50} />
                            <View style={{ top: -337, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14.5 }}>{t('loading.getting-things-ready')}!</Text>
                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 13.5, top: 2, left: 2 }}>{t('loading.please-wait')} ....</Text>
                            </View>
                        </View>)}
                </View>
                )}

            </View>
        </>
    )
}