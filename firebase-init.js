import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, remove, update, query, orderByChild, equalTo, serverTimestamp, get, limitToLast, runTransaction, increment, onChildAdded, onChildChanged, onChildRemoved } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
const firebaseConfig = {
    apiKey: "AIzaSyAPGWg3xMZy3hwj3evdof2i4J9rlS32THg",
    authDomain: "editorial-board-shkolyar.firebaseapp.com",
    projectId: "editorial-board-shkolyar",
    storageBucket: "editorial-board-shkolyar.firebasestorage.app",
    messagingSenderId: "908928971705",
    appId: "1:908928971705:web:047ed7eaec88ef7f1a3c68",
    databaseURL: "https://editorial-board-shkolyar-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
export { 
    app, db, auth, 
    ref, onValue, push, set, remove, update, query, orderByChild, equalTo, serverTimestamp, get, limitToLast, runTransaction, increment, onChildAdded, onChildChanged, onChildRemoved,
    signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut,
    showLoader, hideLoader, showNotification, escapeHTML, SHOP_ITEMS_BASE 
};
const loaderOverlay = document.getElementById('loader-overlay');
const notificationContainer = document.getElementById('notification-container');
const showLoader = () => loaderOverlay.classList.add('visible');
const hideLoader = () => loaderOverlay.classList.remove('visible');
const showNotification = (message, type = 'success') => {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'notif-close';
    notif.appendChild(closeBtn);
    container.appendChild(notif);
    const timer = setTimeout(() => {
        notif.style.animation = 'fadeOut 0.5s ease forwards';
        notif.addEventListener('animationend', () => notif.remove());
    }, 6000);
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        notif.remove();
        clearTimeout(timer);
    };
    notif.onclick = () => {
        notif.remove();
        clearTimeout(timer);
    };
};
const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('editorAppTheme', theme);
    const toggles = document.querySelectorAll('.theme__toggle');
    toggles.forEach(toggle => {
        if (theme === 'light') {
            toggle.checked = true;
        } else {
            toggle.checked = false;
        }
    });
};
const savedTheme = localStorage.getItem('editorAppTheme') || 'dark';
applyTheme(savedTheme);
document.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('theme__toggle')) {
        const newTheme = e.target.checked ? 'light' : 'dark';
        applyTheme(newTheme);
    }
});
const applyPartyMode = () => {
    const isPartySaved = localStorage.getItem('editorAppPartyMode') === 'true';
    if (isPartySaved) {
        document.body.classList.add('party-mode');
    }
};
if (document.body) {
    applyPartyMode();
} else {
    const observer = new MutationObserver(() => {
        if (document.body) {
            applyPartyMode();
            observer.disconnect();
        }
    });
    observer.observe(document.documentElement, { childList: true });
}
document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.theme__toggle');
    const currentTheme = localStorage.getItem('editorAppTheme') || 'dark';
    let partyClicks = 0;
    let partyTimeout;
    toggles.forEach(toggle => {
        toggle.checked = (currentTheme === 'light');
        toggle.addEventListener('click', () => {
            partyClicks++;
            clearTimeout(partyTimeout);
            partyTimeout = setTimeout(() => { partyClicks = 0; }, 500);
            if (partyClicks === 5) {
                const isNowActive = document.body.classList.toggle('party-mode');
                localStorage.setItem('editorAppPartyMode', isNowActive);
                const navMenu = document.querySelector('.nav-menu') || document.getElementById('auth-controls');
                if (navMenu) navMenu.classList.remove('active');
                document.body.style.overflow = '';
                const msg = isNowActive ? '🪩 PARTY TIME! 🪩' : 'Вечеринка окончена...';
                showNotification(msg);
                partyClicks = 0;
            }
        });
    });
});
const SHOP_ITEMS_BASE = {
    avatars: [
        { id: 'av_1', name: 'Перо', src: 'avatar1.png', price: 100 },
        { id: 'av_2', name: 'Робот', src: 'avatar2.png', price: 250 },
        { id: 'av_3', name: 'Кот', src: 'avatar3.png', price: 500 },
        { id: 'av_4', name: 'Космос', src: 'avatar4.png', price: 1000 },
        { id: 'av_5', name: 'Ниндзя', src: 'avatar5.png', price: 2000 },
        { id: 'av_6', name: 'Корона', src: 'avatar6.png', price: 5000 },
        { id: 'av_admin_eye', name: 'Всевидящее Око', src: 'admin_eye.png', price: 0, isHidden: true },
    ],
    titles: [
        { id: 'ttl_1', name: 'Титул: "Графоман"', value: 'Графоман', price: 150 },
        { id: 'ttl_meme1', name: 'Титул: "Забыл сменку"', value: 'Забыл сменку', price: 150 },
        { id: 'ttl_meme2', name: 'Титул: "Дай списать"', value: 'Дай списать', price: 250 },
        { id: 'ttl_2', name: 'Титул: "Душнила"', value: 'Душнила', price: 300 },
        { id: 'ttl_new1', name: 'Титул: "Адепт дедлайна"', value: 'Адепт дедлайна', price: 400 },
        { id: 'ttl_new2', name: 'Титул: "Генератор воды"', value: 'Генератор воды', price: 550 },
        { id: 'ttl_meme3', name: 'Титул: "Жертва ЕГЭ"', value: 'Жертва ЕГЭ', price: 666 },
        { id: 'ttl_new3', name: 'Титул: "Сын маминой подруги"', value: 'Сын маминой подруги', price: 777 },
        { id: 'ttl_meme4', name: 'Титул: "Мам, я поел"', value: 'Мам, я поел', price: 800 },
        { id: 'ttl_new4', name: 'Титул: "Пишу за еду"', value: 'Пишу за еду', price: 900 },
        { id: 'ttl_new5', name: 'Титул: "Повелитель запятых"', value: 'Повелитель запятых', price: 1200 },
        { id: 'ttl_3', name: 'Титул: "Гений"', value: 'Гений мысли', price: 2000 },
        { id: 'ttl_4', name: 'Титул: "Босс"', value: 'Big Boss', price: 5000 },
        { id: 'ttl_black1', name: 'Титул: "Сплю на уроках"', value: 'Сплю на уроках', price: 1500, isBlackMarket: true },
        { id: 'ttl_black2', name: 'Титул: "Торговец ответами"', value: 'Торговец ответами', price: 2000, isBlackMarket: true },
        { id: 'ttl_black3', name: 'Титул: "Призрак столовой"', value: 'Призрак столовой', price: 2500, isBlackMarket: true },
        { id: 'ttl_light_lord', name: 'Повелитель Света', value: 'Повелитель Света', price: 0, isHidden: true },
        { id: 'ttl_dark_lord', name: 'Владыка Тьмы', value: 'Владыка Тьмы', price: 0, isHidden: true },
        { id: 'ttl_accountant', name: 'Титул: "Счетовод"', value: 'accountant', price: 7000 },
    ],
    borders: [
        { id: 'brd_gold', name: 'Золотая рамка', class: 'border-gold', price: 500 },
        { id: 'brd_neon', name: 'Неон', class: 'border-neon', price: 1500 },
        { id: 'brd_fire', name: 'Огонь', class: 'border-fire', price: 3000 },
        { id: 'brd_void', name: 'Мистика', class: 'border-void', price: 4000 },
        { id: 'brd_perimeter', name: 'Периметр (Evo)', class: 'border-perimeter', price: 4500 },
        { id: 'brd_hydro', name: 'Гидросфера', class: 'border-hydro', price: 4500 },
        { id: 'brd_glitch', name: 'Глитч', class: 'border-glitch', price: 5000 },
        { id: 'frame_event_horizon', name: 'Сингулярность', class: 'frame-event-horizon', price: 0, isHidden: true },
    ],
    auras: [
        { id: 'aura_shadow_seal', name: 'Печать Тени', class: 'aura-shadow-seal', price: 0, isHidden: true},
        { id: 'aura_chains', name: 'Цепи Бездны', class: 'aura-chains', price: 2500 },
        { id: 'aura_flowers', name: 'Поляна', class: 'aura-flowers', price: 1500 },
        { id: 'aura_laurel', name: 'Цезарь', class: 'aura-laurel', price: 5000 },
        { id: 'aura_smileys', name: 'Хайп', class: 'aura-smileys', price: 2000 }
    ],
};
const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;
    if (header) {
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < 50) {
                header.classList.remove('header-hidden');
            } 
            else if (currentScrollY > lastScrollY) {
                header.classList.add('header-hidden');
            } 
            else {
                header.classList.remove('header-hidden');
            }
            lastScrollY = currentScrollY;
        }, { passive: true }); 
    }
});
let connectionTimeout;
let isFirstConnectAttempt = true;
const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        clearTimeout(connectionTimeout);
        if (!isFirstConnectAttempt) {
            showNotification("Соединение с сервером восстановлено! 🌐", "success");
        }
        isFirstConnectAttempt = false;
    } else {
        clearTimeout(connectionTimeout);
        connectionTimeout = setTimeout(() => {
            showNotification("Не удалось подключиться к серверам. Пожалуйста, включите VPN для обхода блокировок вашего провайдера. 📡", "error");
            isFirstConnectAttempt = false;
        }, 8000);
    }
});