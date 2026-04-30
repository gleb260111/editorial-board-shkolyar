import { 
    auth, db, 
    signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged,
    ref, set,
    showLoader, hideLoader, showNotification 
} from './firebase-init.js';
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register-form');
const showLoginLink = document.getElementById('show-login-form');
const handleLogin = async (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    if (email.toLowerCase() === 'admin' && password.toLowerCase() === 'admin') {
        showNotification('Хорошая попытка, товарищ майор.', 'error');
        return; 
    }
    showLoader();
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showNotification('Ошибка входа: неверный email или пароль.', 'error');
        hideLoader();
    }
};
let isRegistering = false;

const handleRegister = async (e) => {
    e.preventDefault();
    const email = registerForm['register-email'].value;
    const password = registerForm['register-password'].value;
    const name = registerForm['register-name'].value.trim();
    const surname = registerForm['register-surname'].value.trim();
    const userClass = registerForm['register-class'].value.trim();
    if (!name || !surname || !userClass) {
        showNotification('Пожалуйста, заполните ФИО и класс.', 'error');
        return;
    }
    if (password.length < 6) {
        showNotification('Пароль должен содержать не менее 6 символов.', 'error');
        return;
    }
    showLoader();
    isRegistering = true;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Дожидаемся записи данных в базу
        await set(ref(db, 'users/' + user.uid), {
            firstName: name,
            lastName: surname,
            userClass: userClass,
            email: email
        });
        
        // И только ПОСЛЕ этого перенаправляем вручную
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTarget = urlParams.get('redirect');
        if (redirectTarget === 'index.html') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        isRegistering = false;
        if (error.code === 'auth/email-already-in-use') {
            showNotification('Этот email уже используется.', 'error');
        } else {
            console.error(error);
            showNotification('Ошибка при регистрации.', 'error');
        }
        hideLoader();
    }
};

onAuthStateChanged(auth, (user) => {
    // Не перенаправляем автоматически, если в данный момент идет регистрация
    if (user && !isRegistering) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTarget = urlParams.get('redirect');
        if (redirectTarget === 'index.html') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } else if (!user) {
        hideLoader();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    showLoader(); 
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