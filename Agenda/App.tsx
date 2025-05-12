import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

  useEffect(() => {
    loadTasksFromStorage();
  }, []);

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
      trigger: date,
    });
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setTimeout(() => setShowTimePicker(true), 300);
    }
  };

  const handleTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setDate(new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      ));
    }
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

  const isExpired = (taskDate: Date) => {
    const now = new Date();
    return taskDate <= now;
  };

  const theme = darkMode ? stylesDark : stylesLight;

  return (
    <View style={[styles.container, theme.container]}>
      <Text style={theme.title}>Gestor de Tareas</Text>

      <TouchableOpacity style={theme.toggle} onPress={() => setDarkMode(!darkMode)}>
        <Text style={theme.toggleText}>{darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}</Text>
      </TouchableOpacity>

      {!formVisible && (
        <TouchableOpacity style={theme.button} onPress={() => setFormVisible(true)}>
          <Text style={theme.buttonText}>➕ Crear Tarea</Text>
        </TouchableOpacity>
      )}

      {formVisible && (
        <View>
          <TextInput
            style={[styles.input, theme.input]}
            placeholder="Título de la tarea"
            placeholderTextColor={darkMode ? "#ccc" : "#888"}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, theme.input]}
            placeholder="Descripción"
            placeholderTextColor={darkMode ? "#ccc" : "#888"}
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={theme.button}>
            <Text style={theme.buttonText}>Seleccionar Fecha y Hora</Text>
          </TouchableOpacity>
          <Text style={{ color: darkMode ? '#fff' : '#000', marginBottom: 10 }}>
            {date.toLocaleString()}
          </Text>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChange}
            />
          )}

          <TouchableOpacity style={theme.button} onPress={addTask}>
            <Text style={theme.buttonText}>✅ Guardar Tarea</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[theme.button, { backgroundColor: '#ccc' }]} onPress={() => setFormVisible(false)}>
            <Text style={{ color: '#000' }}>⬅️ Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={[
            styles.taskContainer,
            theme.taskContainer,
            isExpired(item.dateObj) && { backgroundColor: '#FFC0CB' }
          ]}>
            <Text style={theme.taskTitle}>{item.title}</Text>
            <Text style={theme.taskDescription}>{item.description}</Text>
            <Text style={theme.taskDate}>{item.dateTime}</Text>
            <TouchableOpacity onPress={() => deleteTask(index)}>
              <Text style={styles.delete}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  input: {
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  taskContainer: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 2,
  },
  delete: { fontSize: 18, marginTop: 5, textAlign: 'right' },
});

const stylesLight = StyleSheet.create({
  container: { backgroundColor: '#f0f4f8' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: { borderColor: '#ccc', color: '#000', backgroundColor: '#fff' },
  button: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 10, alignItems: 'center', marginVertical: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  taskContainer: { backgroundColor: '#fff', borderColor: '#ddd' },
  taskTitle: { fontWeight: 'bold', fontSize: 18, color: '#000' },
  taskDescription: { color: '#555', marginTop: 4 },
  taskDate: { color: '#999', marginTop: 4 },
  toggle: { marginBottom: 15, alignItems: 'flex-start' },
  toggleText: { color: '#4CAF50' },
});

const stylesDark = StyleSheet.create({
  container: { backgroundColor: '#121212' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  input: { borderColor: '#555', color: '#fff', backgroundColor: '#1e1e1e' },
  button: { backgroundColor: '#03DAC5', padding: 12, borderRadius: 10, alignItems: 'center', marginVertical: 5 },
  buttonText: { color: '#000', fontWeight: 'bold' },
  taskContainer: { backgroundColor: '#1e1e1e', borderColor: '#444' },
  taskTitle: { fontWeight: 'bold', fontSize: 18, color: '#fff' },
  taskDescription: { color: '#ccc', marginTop: 4 },
  taskDate: { color: '#aaa', marginTop: 4 },
  toggle: { marginBottom: 15, alignItems: 'flex-start' },
  toggleText: { color: '#03DAC5' },
});
