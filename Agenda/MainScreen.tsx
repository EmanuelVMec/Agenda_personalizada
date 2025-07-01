import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  SafeAreaView, Switch, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';


interface Task {
  title: string;
  description: string;
  dateTime: string;
  dateObj: Date;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // ✅ muestra la notificación en pantalla
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,     // ✅ aparece también en el centro de notificaciones
  }),
});

export default function MainScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const backgroundAnim = useState(new Animated.Value(0))[0];
  const isExpired = (taskDate: Date) => new Date() >= new Date(taskDate);
  const navigation = useNavigation();
  const frases = [
  '💡 ¡Hoy es un buen día para avanzar!',
  '🚀 Da un paso más hacia tus metas.',
  '🌟 Cree en ti y en lo que haces.',
  '📌 Organiza tu día, domina tu camino.',
  '✅ ¡Tú puedes con todo lo que viene!',
  '🧠 La disciplina vence al talento.',
];

const [fraseMotivacional, setFraseMotivacional] = useState('');

 useEffect(() => {
  Notifications.requestPermissionsAsync();
  loadTasksFromStorage();
  const timer = setInterval(() => setCurrentTime(new Date()), 1000);
  animateBackground();
  const frase = frases[Math.floor(Math.random() * frases.length)];
  setFraseMotivacional(frase);
  return () => clearInterval(timer);
}, [darkMode]);


  const animateBackground = () => {
    backgroundAnim.setValue(0);
    Animated.loop(
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  };

  const interpolatedBackground = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: darkMode ? ['#121212', '#1e1e1e'] : ['#f5e6f2', '#fdeff9'],
  });

  const saveTasksToStorage = async (tasks: Task[]) => {
    try {
      await AsyncStorage.setItem('@tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks', e);
    }
  };

  const loadTasksFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('@tasks');
      if (stored) setTasks(JSON.parse(stored));
    } catch (e) {
      console.error('Error loading tasks', e);
    }
  };

  const scheduleNotification = async (title: string, body: string, date: Date) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: 'date',
      date: date,
    },
  });
};

  const addTask = async () => {
    if (!title.trim() || !dateInput || !timeInput) {
      Alert.alert('Por favor completa la fecha y la hora.');
      return;
    }

    const [month, day] = dateInput.split('-').map(Number);
    const [hour, minute] = timeInput.split('-').map(Number);
    const currentYear = new Date().getFullYear();
    const date = new Date(currentYear, month - 1, day, hour, minute);

    if (isNaN(date.getTime()) || date <= new Date()) {
      Alert.alert('Fecha y hora inválidas o en el pasado.');
      return;
    }

    const newTask: Task = {
      title,
      description,
      dateTime: date.toLocaleString(),
      dateObj: date,
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    await saveTasksToStorage(updated);
    await scheduleNotification(`Recordatorio: ${title}`, description || '¡No olvides tu tarea!', date);

    setTitle('');
    setDescription('');
    setDateInput('');
    setTimeInput('');
    setFormVisible(false);
  };

  const deleteTask = async (index: number) => {
    const updated = [...tasks];
    updated.splice(index, 1);
    setTasks(updated);
    await saveTasksToStorage(updated);
  };

  const styles = getStyles(darkMode);
  const currentHour = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={[styles.container, { backgroundColor: interpolatedBackground }]}>
      <LottieView
        source={require('./assets/Animation - 1751330906942.json')}
        autoPlay
        loop
        style={{
          width: 800,
          height: 800,
          left: -200,
          alignSelf: 'center',
          position: 'absolute',
          zIndex: -1,
          opacity: 0.77,
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={styles.headerBox}>
              <Text style={[styles.motivational, { color: darkMode ? '#ccc' : '#333' }]}>
  {fraseMotivacional}
</Text>
              <Text style={styles.agendaTitle}>A G E N D A</Text>
              <View style={styles.timeBox}>
                <Text style={styles.dateBig}>{currentTime.getDate()}</Text>
                <View>
                  <Text style={styles.dateSmall}>{currentTime.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                  <Text style={styles.timeSmall}>{currentHour}</Text>
                </View>
              </View>
              <View style={styles.switchRow}>
                <TouchableOpacity
                  style={[styles.toggleButton, { backgroundColor: darkMode ? '#fff' : '#333' }]}
                  onPress={() => setDarkMode(!darkMode)}
                >
                  <Text style={{ color: darkMode ? '#000' : '#fff' }}>{darkMode ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!formVisible && (
              <TouchableOpacity style={styles.button} onPress={() => setFormVisible(true)}>
                <Text style={styles.buttonText}>➕ Nueva Tarea</Text>
              </TouchableOpacity>
            )}

            {formVisible && (
              <View style={styles.formBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Título"
                  placeholderTextColor="#999"
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={styles.textArea}
                  placeholder="Descripción"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Fecha (MM-DD)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={dateInput}
                  onChangeText={setDateInput}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Hora (HH-MM)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={timeInput}
                  onChangeText={setTimeInput}
                />

                <TouchableOpacity style={styles.buttonSmall} onPress={addTask}>
                  <Text style={styles.buttonTextSmall}>✅ Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonCancel} onPress={() => setFormVisible(false)}>
                  <Text style={styles.buttonTextSmall}>❌ Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
<TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('Historial', { tasks, deleteTask, isExpired, darkMode })}>
  <Text style={styles.buttonText}>📋 Ver Historial</Text>
</TouchableOpacity>

            
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const getStyles = (darkMode: boolean) => StyleSheet.create({
  container: { flex: 1, padding: 40 },
  headerBox: { alignItems: 'center', marginBottom: 27 },
  agendaTitle: { fontSize: 40, fontWeight: 'bold', color: darkMode ? '#fff' : '#6a1b9a' },
  timeBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dateBig: { fontSize: 100, fontWeight: 'bold', color: darkMode ? '#fff' : '#000', marginRight: 10 },
  dateSmall: { fontSize: 40, color: darkMode ? '#ccc' : '#333' },
  timeSmall: { fontSize: 40, color: darkMode ? '#aaa' : '#555' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  toggleButton: { padding: 10, borderRadius: 30 },
  button: { backgroundColor: darkMode ? '#673ab7' : '#ab47bc', padding: 12, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  formBox: { backgroundColor: darkMode ? '#2e2e2e' : '#fff', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 5 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 8, marginBottom: 12, fontSize: 16, color: darkMode ? '#fff' : '#000' },
  textArea: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, height: 80, textAlignVertical: 'top', marginBottom: 12, fontSize: 16, color: darkMode ? '#fff' : '#000' },
  buttonSmall: { backgroundColor: darkMode ? '#9575cd' : '#ce93d8', padding: 10, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  buttonCancel: { backgroundColor: darkMode ? '#c2185b' : '#f8bbd0', padding: 10, borderRadius: 10, alignItems: 'center' },
  buttonTextSmall: { color: darkMode ? '#fff' : '#4a148c', fontWeight: '600' },
  taskCard: { backgroundColor: darkMode ? '#3a3a3a' : '#ffffff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 3 },
  taskTitle: { fontSize: 18, fontWeight: 'bold', color: darkMode ? '#fff' : '#6a1b9a' },
  taskDescription: { fontSize: 15, color: darkMode ? '#ddd' : '#555', marginVertical: 4 },
  taskDate: { fontSize: 13, color: darkMode ? '#aaa' : '#999' },
  delete: { fontSize: 20, textAlign: 'right', marginTop: 8, color: darkMode ? '#fff' : '#000' },
  taskExpired: {
  backgroundColor: darkMode ? '#4e4e4e' : '#f8d7da', // gris oscuro o rosado claro
  borderColor: darkMode ? '#a00' : '#d9534f',       // rojo más visible
  borderWidth: 1,
},
motivational: {
  fontSize: 21,
  fontStyle: 'italic',
  textAlign: 'center',
  marginBottom: 21,
  top: 7,
},

});
