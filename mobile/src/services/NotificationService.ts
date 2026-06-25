import RNAndroidNotificationListener, {
  NotificationEvent,
} from 'react-native-android-notification-listener';
import axios from 'axios';

const IMPORTANT_PACKAGES = [
  'com.whatsapp',
  'com.facebook.orca', // Messenger
  'org.telegram.messenger',
  'com.google.android.gm', // Gmail
  'com.android.mms', // SMS
  'com.google.android.apps.messaging', // Google Messages
  'com.microsoft.office.outlook',
];

export const setupNotificationListener = (userId: number, baseUrl: string) => {
  try {
    if (!RNAndroidNotificationListener || typeof RNAndroidNotificationListener.getPermissionStatus !== 'function') {
      console.log('Notification Listener is not available.');
      return;
    }

    RNAndroidNotificationListener.getPermissionStatus().then((status) => {
      console.log('Notification Listener Permission Status:', status);
    });

    if (typeof RNAndroidNotificationListener.onNotificationReceived === 'function') {
      RNAndroidNotificationListener.onNotificationReceived((notification: NotificationEvent) => {
        const { app, title, text, notificationId } = notification;
        
        // Check if it's an important app
        if (IMPORTANT_PACKAGES.includes(app) || (app && (app.includes('chat') || app.includes('mail')))) {
          console.log('Important notification received:', app, title);
          
          // Send to backend
          axios.post(`${baseUrl}/api/notifications`, {
            userId,
            appPackage: app,
            title,
            text,
            notificationId,
          }).catch(err => {
            console.error('Failed to send notification to backend:', err.message);
          });
        }
      });
    }
  } catch (e) {
    console.error('Error in setupNotificationListener:', e);
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (RNAndroidNotificationListener && typeof RNAndroidNotificationListener.getPermissionStatus === 'function') {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      if (status !== 'authorized' && typeof RNAndroidNotificationListener.requestPermission === 'function') {
        RNAndroidNotificationListener.requestPermission();
      }
    }
  } catch (e) {
    console.error('Error requesting notification permission:', e);
  }
};
