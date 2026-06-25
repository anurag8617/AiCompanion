/**
 * @format
 */

import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import RNAndroidNotificationListener, { RNAndroidNotificationListenerHeadlessJsName } from 'react-native-android-notification-listener';

const headlessNotificationListener = async ({ notification }) => {
  if (notification) {
    const parsedNotification = typeof notification === 'string' ? JSON.parse(notification) : notification;
    console.log('Background Notification Received: ', parsedNotification.title);
    
    // In production, we send this to the Memory Engine via API
    // axios.post(...)
  }
};

AppRegistry.registerHeadlessTask(RNAndroidNotificationListenerHeadlessJsName, () => headlessNotificationListener);

AppRegistry.registerComponent(appName, () => App);
