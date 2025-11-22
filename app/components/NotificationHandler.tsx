"use client";

import { useEffect, useState } from "react";
import { requestNotificationPermission, onMessageListener } from "@/lib/firebase";
import { supabase } from "@/lib/supabaseClient";
import { Bell, X } from "lucide-react";

export default function NotificationHandler() {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    // Vérifier si les notifications sont déjà autorisées
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Afficher le prompt après 3 secondes
        setTimeout(() => {
          setShowPermissionPrompt(true);
        }, 3000);
      } else if (Notification.permission === 'granted') {
        // Si déjà autorisé, obtenir le token
        initializeNotifications();
      }
    }

    // Écouter les messages en premier plan
    onMessageListener()
      .then((payload: any) => {
        console.log('📬 Notification reçue:', payload);
        setNotification(payload.notification);
        
        // Vibration
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
        
        // Cacher après 5 secondes
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      })
      .catch((err) => console.log('Erreur écoute messages:', err));
  }, []);

  const initializeNotifications = async () => {
    const token = await requestNotificationPermission();
    
    if (token) {
      // Sauvegarder le token dans Supabase pour l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', user.id);
        
        console.log('✅ Token FCM sauvegardé pour l\'utilisateur');
      }
    }
  };

  const handleAllowNotifications = async () => {
    setShowPermissionPrompt(false);
    await initializeNotifications();
  };

  const handleDismiss = () => {
    setShowPermissionPrompt(false);
  };

  return (
    <>
      {/* Prompt pour demander la permission */}
      {showPermissionPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-500 rounded-xl shadow-2xl p-4 animate-slideUp">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Activer les notifications
              </h3>
              <p className="text-white/80 text-sm mb-3">
                Reçois des alertes quand tu as un nouveau match ou message ! 💕
              </p>
              
              <button
                onClick={handleAllowNotifications}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Activer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification en premier plan */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-white rounded-xl shadow-2xl p-4 animate-slideDown">
          <button
            onClick={() => setNotification(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              💜
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {notification.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {notification.body}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
}