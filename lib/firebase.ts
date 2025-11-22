// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBmLAf0wVSyqTy6GVI2dC4fDs82pnGdNtw",
  authDomain: "xmoon-95c2b.firebaseapp.com",
  projectId: "xmoon-95c2b",
  storageBucket: "xmoon-95c2b.firebasestorage.app",
  messagingSenderId: "582494816988",
  appId: "1:582494816988:web:c0b1931f152b384ffe8219"
};

// Clé VAPID pour Web Push
const vapidKey = "BGZ9Wp8UT4qmEbcsZ29yWKUCn0c_iPZag5gnq-xBVwBCgLegU3qG-uJ18T6jQEem2x_XMYGFdsXhVu4tLWDwvj4";

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Get messaging instance (only in browser)
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.log("Messaging not supported");
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("✅ Permission accordée pour les notifications");
      
      const token = await getToken(messaging, { vapidKey });
      console.log("🔑 FCM Token:", token);
      
      return token;
    } else {
      console.log("❌ Permission refusée");
      return null;
    }
  } catch (error) {
    console.error("Erreur demande permission:", error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    
    onMessage(messaging, (payload) => {
      console.log("📬 Message reçu en premier plan:", payload);
      resolve(payload);
    });
  });

export { app, messaging };