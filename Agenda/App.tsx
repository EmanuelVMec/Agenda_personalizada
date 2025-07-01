import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Switch, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker, { Event } from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Task {
  title: string;
  description: string;
  dateTime: string;
  dateObj: Date;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const backgroundAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadTasksFromStorage();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    animateBackground();
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
      const jsonTasks = JSON.stringify(tasks);
      await AsyncStorage.setItem('@tasks', jsonTasks);
    } catch (e) {
      console.error('Error saving tasks to storage', e);
    }
  };

  const loadTasksFromStorage = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('@tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (e) {
      console.error('Error loading tasks from storage', e);
    }
  };

  const scheduleNotification = async (title: string, body: string, date: Date) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      type: 'date',
      date: date,
    },
  });
};


  const handleDateChange = (_event: Event, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(new Date(selectedDate));
      setShowDatePicker(false);
      setTimeout(() => setShowTimePicker(true), 300);
    } else {
      setShowDatePicker(false);
    }
  };

const handleTimeChange = (_event: any, selectedTime?: Date) => {
  if (selectedTime) {
    const newDate = new Date(date);
    newDate.setHours(selectedTime.getHours());
    newDate.setMinutes(selectedTime.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    setDate(newDate);
  }
  setShowTimePicker(false);
};




  const addTask = async () => {
    if (!title.trim()) return;
    const taskDate = new Date(date);
    const now = new Date();
    if (taskDate <= now) {
      Alert.alert('La fecha debe ser en el futuro.');
      return;
    }
    const newTask: Task = {
      title,
      description,
      dateTime: taskDate.toLocaleString(),
      dateObj: taskDate,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await saveTasksToStorage(updatedTasks);
    await scheduleNotification(`Recordatorio: ${title}`, description || '¡No olvides tu tarea!', taskDate);
    setTitle('');
    setDescription('');
    setDate(new Date());
    setFormVisible(false);
  };

  const deleteTask = async (index: number) => {
    const updated = [...tasks];
    updated.splice(index, 1);
    setTasks(updated);
    await saveTasksToStorage(updated);
  };

  const isExpired = (taskDate: Date) => new Date() >= new Date(taskDate);

  const styles = getStyles(darkMode);
  const currentHour = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={[styles.container, { backgroundColor: interpolatedBackground }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={styles.headerBox}>
              <Text style={styles.agendaTitle}>A G E N D A</Text>
              <View style={styles.timeBox}>
                <Text style={styles.dateBig}>{currentTime.getDate()}</Text>
                <View>
                  <Text style={styles.dateSmall}>{currentTime.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                  <Text style={styles.timeSmall}>{currentHour}</Text>
                </View>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{darkMode ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}</Text>
                <Switch value={darkMode} onValueChange={setDarkMode} />
              </View>
            </View>

            {!formVisible && (
              <TouchableOpacity style={styles.button} onPress={() => setFormVisible(true)}>
                <Text style={styles.buttonText}>➕ Nueva Tarea</Text>
              </TouchableOpacity>
            )}

            {formVisible && (
              <View style={styles.formBox}>
                <TextInput style={styles.input} placeholder="Título" placeholderTextColor="#999" value={title} onChangeText={setTitle} />
                <TextInput style={styles.textArea} placeholder="Descripción" placeholderTextColor="#999" multiline numberOfLines={4} value={description} onChangeText={setDescription} />
                <TouchableOpacity style={styles.buttonSmall} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.buttonTextSmall}>📅 Seleccionar Fecha y Hora</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker value={date} mode="date" is24Hour display="default" onChange={handleDateChange} />
                )}
                {showTimePicker && (
                  <DateTimePicker value={date} mode="time" is24Hour display="default" onChange={handleTimeChange} />
                )}
                <TouchableOpacity style={styles.buttonSmall} onPress={addTask}>
                  <Text style={styles.buttonTextSmall}>✅ Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonCancel} onPress={() => setFormVisible(false)}>
                  <Text style={styles.buttonTextSmall}>❌ Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}

            {tasks.map((item, index) => (
              <View key={index.toString()} style={[styles.taskCard, isExpired(item.dateObj) && styles.taskExpired]}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDescription}>{item.description}</Text>
                <Text style={styles.taskDate}>{item.dateTime}</Text>
                <TouchableOpacity onPress={() => deleteTask(index)}>
                  <Text style={styles.delete}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// Mantener estilos actuales...


const getStyles = (darkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 50,
  },
  headerBox: {
    marginBottom: 10,
    alignItems: 'center',
  },
  agendaTitle: {
    fontSize: 40,
    letterSpacing: 4,
    fontWeight: 'bold',
    color: darkMode ? '#fff' : '#6a1b9a',
    marginBottom: 25,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  dateBig: {
    fontSize: 100,
    fontWeight: 'bold',
    color: darkMode ? '#fff' : '#000',
    marginRight: 10,
  },
  dateSmall: {
    fontSize: 40,
    color: darkMode ? '#ccc' : '#333',
  },
  timeSmall: {
    fontSize: 40,
    color: darkMode ? '#aaa' : '#555',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  switchLabel: {
    fontSize: 17,
    marginRight: 10,
    color: darkMode ? '#fff' : '#6a1b9a',
  },
  button: {
    backgroundColor: darkMode ? '#673ab7' : '#ab47bc',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formBox: {
  backgroundColor: darkMode ? '#2e2e2e' : '#fff',
  borderRadius: 15,
  padding: 15,
  marginBottom: 20,
  elevation: 5,
  width: '100%', // Añadido para ocupar todo el ancho
  alignSelf: 'center',
},
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 16,
    color: darkMode ? '#fff' : '#000',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    fontSize: 16,
    color: darkMode ? '#fff' : '#000',
  },
  buttonSmall: {
    backgroundColor: darkMode ? '#9575cd' : '#ce93d8',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonCancel: {
    backgroundColor: darkMode ? '#c2185b' : '#f8bbd0',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonTextSmall: {
    color: darkMode ? '#fff' : '#4a148c',
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: darkMode ? '#3a3a3a' : '#ffffff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  taskExpired: {
    backgroundColor: darkMode ? '#c2185b' : '#f8bbd0',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: darkMode ? '#fff' : '#6a1b9a',
  },
  taskDescription: {
    fontSize: 15,
    color: darkMode ? '#ddd' : '#555',
    marginVertical: 4,
  },
  taskDate: {
    fontSize: 13,
    color: darkMode ? '#aaa' : '#999',
  },
  delete: {
    fontSize: 20,
    textAlign: 'right',
    marginTop: 8,
    color: darkMode ? '#fff' : '#000',
  },
});
