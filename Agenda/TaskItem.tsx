import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TaskItemProps {
  task: string;
  onDelete: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onDelete }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{task}</Text>
      <TouchableOpacity onPress={onDelete}>
        <Text style={styles.delete}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10, marginVertical: 5,
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#eee', borderRadius: 8,
  },
  text: { fontSize: 16 },
  delete: { fontSize: 18 },
});

export default TaskItem;
