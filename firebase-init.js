// Импорт модулей Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAPGWg3xMZy3hwj3evdof2i4J9rlS32THg",
    authDomain: "editorial-board-shkolyar.firebaseapp.com",
    projectId: "editorial-board-shkolyar",
    storageBucket: "editorial-board-shkolyar.firebasestorage.app",
    messagingSenderId: "908928971705",
    appId: "1:908928971705:web:047ed7eaec88ef7f1a3c68",
    databaseURL: "https://editorial-board-shkolyar-default-rtdb.firebaseio.com"
};

// Инициализация сервисов Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Экспорт для использования в других скриптах
export { app, db, auth };

// --- Блок утилитарных функций ---

const loaderOverlay = document.getElementById('loader-overlay');
const notificationContainer = document.getElementById('notification-container');

// Функции для управления экраном загрузки
export const showLoader = () => loaderOverlay.classList.add('visible');
export const hideLoader = () => loaderOverlay.classList.remove('visible');

// Отображение всплывающих уведомлений (success, error, info)
export const showNotification = (message, type = 'success') => {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    notificationContainer.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.5s ease forwards';
        notif.addEventListener('animationend', () => notif.remove());
    }, 4000);
};