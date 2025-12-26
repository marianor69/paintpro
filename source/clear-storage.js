/**
 * Temporary script to clear AsyncStorage
 * Run this once to fix the branch-switching state issue
 */
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearStorage() {
  try {
    console.log('🧹 Clearing AsyncStorage...');
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared successfully!');
    console.log('👉 You can now reload the app');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
}

clearStorage();
