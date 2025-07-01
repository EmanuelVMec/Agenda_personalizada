import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './MainScreen';
import HistoryScreen from './HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen name="Inicio" component={MainScreen} />
  <Stack.Screen name="Historial" component={HistoryScreen} />
</Stack.Navigator>

    </NavigationContainer>
  );
}
