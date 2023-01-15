import AsyncStorage from '@react-native-async-storage/async-storage'

export async function getCache(key: any) {
  try {
    let value = await AsyncStorage.getItem(key)
    return value && JSON.parse(value)
  } catch (e) {
    // console.log("caught error", e);
  }
}

export async function setCache(key: any, value: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    // console.log("caught error", e);
  }
}

export async function rmCache(key: any) {
  try {
    await AsyncStorage.removeItem(key)
  } catch (e) {
    // console.log("caught error", e);
  }
}
