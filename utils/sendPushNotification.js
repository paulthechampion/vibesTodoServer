const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export async function sendPushNotification(expoPushToken, message) {
  const payload = {
    to: expoPushToken,
    sound: 'default',
    title: message.title,
    body: message.body,
    data: message.data || {},
    priority: 'high',
    apns: {
      payload: {
        aps: {
          'mutable-content': 1
        }
      }
    }
  };
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (data.errors) {
    console.error('Expo push notification error:', data.errors);
    throw new Error('Failed to send push notification');
  }
}