import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Easing
} from 'react-native';
import LottieView from 'lottie-react-native';

export default function HistoryScreen({ route }) {
  const { tasks, deleteTask, isExpired, darkMode } = route.params;

  const expiredTasks = tasks.filter(task => isExpired(new Date(task.dateObj)));
  const pendingTasks = tasks.filter(task => !isExpired(new Date(task.dateObj)));

  const backgroundAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const interpolatedBackground = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: darkMode ? ['#121212', '#1e1e1e'] : ['#f5e6f2', '#fdeff9'],
  });

  const groupByMonth = (list) => {
    const grouped = {};
    list.forEach(task => {
      const date = new Date(task.dateObj);
      const monthLabel = date.toLocaleString('default', { month: 'long' });
      const key = `${monthLabel} ${date.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });
    return grouped;
  };

  const renderGroupedTasks = (groupedTasks, label, isExpiredGroup = false) => {
    const sections = Object.entries(groupByMonth(groupedTasks));

    if (sections.length === 0) {
      return <Text style={styles.noTasks}>No hay {label.toLowerCase()}.</Text>;
    }

    return (
      <>
        <Text style={[
          styles.sectionTitle,
          { color: isExpiredGroup ? '#e91e63' : '#4caf50' }
        ]}>
          {label}
        </Text>

        {sections.map(([month, tasks]) => (
          <View key={month}>
            <Text style={[styles.monthTitle, { color: darkMode ? '#fff' : '#555' }]}>{month}</Text>
            {tasks.map((item, index) => (
              <View
                key={index.toString()}
                style={[
                  styles.taskCard,
                  isExpiredGroup ? styles.taskExpired : styles.taskPending
                ]}
              >
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDescription}>{item.description}</Text>
                <Text style={styles.taskDate}>{item.dateTime}</Text>
                <TouchableOpacity onPress={() => deleteTask(index)}>
                  <Text style={styles.delete}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </>
    );
  };

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
          opacity: 0.75,
        }}
      />
      <Text style={[styles.title, { color: darkMode ? '#fff' : '#000' }]}>Historial de Tareas</Text>
      <FlatList
        ListHeaderComponent={
          <>
            {renderGroupedTasks(pendingTasks, 'Tareas Pendientes', false)}
            {renderGroupedTasks(expiredTasks, 'Tareas Expiradas', true)}
          </>
        }
        data={[]}
        renderItem={null}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  monthTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6, color: '#555' },

  taskCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 3,
  },
  taskExpired: {
    backgroundColor: '#f8bbd0', // Expirada - Rosa claro
  },
  taskPending: {
    backgroundColor: '#e0f2f1', // Pendiente - Verde claro
  },

  taskTitle: { fontWeight: 'bold', fontSize: 16 },
  taskDescription: { marginTop: 4, fontSize: 14 },
  taskDate: { color: '#666', fontSize: 13, marginTop: 2 },
  delete: { textAlign: 'right', color: 'red', fontSize: 18, marginTop: 5 },
  noTasks: { fontStyle: 'italic', textAlign: 'center', color: '#999', marginVertical: 10 },
});
