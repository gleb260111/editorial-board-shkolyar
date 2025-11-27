// Импорт из Firebase SDK и общего файла
import { auth, showLoader, hideLoader, showNotification } from './firebase-init.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Получение ссылок на DOM-элементы
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register-form');
const showLoginLink = document.getElementById('show-login-form');

// Вход пользователя в систему
const handleLogin = async (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    showLoader();
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged сам перенаправит
    } catch (error) {
        showNotification('Ошибка входа: неверный email или пароль.', 'error');
        hideLoader();
    }
};

// Регистрация нового пользователя
const handleRegister = async (e) => {
    e.preventDefault();
    const email = registerForm['register-email'].value;
    const password = registerForm['register-password'].value;
    if (password.length < 6) {
        showNotification('Пароль должен содержать не менее 6 символов.', 'error');
        return;
    }
    showLoader();
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged сам перенаправит
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showNotification('Этот email уже используется.', 'error');
        } else {
            showNotification('Ошибка при регистрации.', 'error');
        }
        hideLoader();
    }
};

// Главный наблюдатель за состоянием аутентификации
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Проверяем, есть ли параметр redirect в адресной строке
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTarget = urlParams.get('redirect');

        // Если сказано вернуться на главную — возвращаем, иначе — в кабинет
        if (redirectTarget === 'index.html') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        // Если пользователь не авторизован, скрываем загрузчик
        hideLoader();
    }
});

// Навешивание обработчиков событий
document.addEventListener('DOMContentLoaded', () => {
    showLoader(); // Показываем загрузчик, пока Firebase проверяет статус входа
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    showRegisterLink.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    showLoginLink.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
});