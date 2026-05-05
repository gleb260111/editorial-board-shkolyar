import { auth, db, signOut, onAuthStateChanged, showLoader, hideLoader, showNotification, update, ref, get } from './firebase-init.js';
if (window.innerWidth > 900) {
    window.location.replace('dashboard.html');
}
const adminPanel = document.getElementById('mobile-admin-panel');
const logoutBtn = document.getElementById('menu-logout-btn');
const closeBtn = document.getElementById('close-menu-btn');
closeBtn.addEventListener('click', () => {
    window.history.back();
});
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = 'index.html');
});
onAuthStateChanged(auth, async (user) => {
    if (user) {
        showLoader();
        try {
            const roleSnap = await get(ref(db, 'roles/' + user.uid));
            const isAdmin = roleSnap.exists() && roleSnap.val() === 'admin';
            if (isAdmin) {
                initAdminFeatures(user.uid);
            }
        } catch (e) {
            console.error(e);
        } finally {
            hideLoader();
        }
    } else {
        window.location.href = 'index.html';
    }
});
async function initAdminFeatures(uid) {
    adminPanel.classList.remove('hidden');
    const setupToggle = (id, key) => {
        const el = document.getElementById(id);
        el.checked = localStorage.getItem(key) !== 'false';
        el.addEventListener('change', (e) => localStorage.setItem(key, e.target.checked));
    };
    setupToggle('mob-singularity', 'pref_show_singularity');
    
    const rawCosmSw = document.getElementById('mob-raw-cosmetics');
    if (rawCosmSw) {
        rawCosmSw.checked = localStorage.getItem('pref_raw_cosmetics') === 'true';
        rawCosmSw.addEventListener('change', (e) => localStorage.setItem('pref_raw_cosmetics', e.target.checked));
    }

    const equippedSnap = await get(ref(db, `users/${uid}/equipped`));
    const equipped = equippedSnap.val() || {};
    if (equipped.title === 'accountant') {
        const currentVal = equipped.title_override || "";
        const wrapper = document.getElementById('mob-accountant-wrapper');
        wrapper.innerHTML = `
            <div style="margin-top: 15px; border-top: 1px dashed #555; padding-top: 10px;">
                <p style="color:#00d5ff; font-size:0.9rem; margin-bottom:5px;">Статус Счетовода</p>
                <select id="mob-acc-select" style="width:100%; padding:10px; background:#222; color:#fff; border:1px solid #444; border-radius:8px;">
                    <option value="" ${currentVal===""?"selected":""}>-- Авто --</option>
                    <option value="📉 Коплю на булочку" ${currentVal==="📉 Коплю на булочку"?"selected":""}>📉 Коплю на булочку</option>
                    <option value="📈 Средний класс" ${currentVal==="📈 Средний класс"?"selected":""}>📈 Средний класс</option>
                    <option value="💰 Счетовод" ${currentVal==="💰 Счетовод"?"selected":""}>💰 Счетовод</option>
                    <option value="💰 Инвестор столовой" ${currentVal==="💰 Инвестор столовой"?"selected":""}>💰 Инвестор столовой</option>
                    <option value="👑 Олигарх 2121" ${currentVal==="👑 Олигарх 2121"?"selected":""}>👑 Олигарх 2121</option>
                </select>
            </div>
        `;
        document.getElementById('mob-acc-select').addEventListener('change', async (e) => {
            showLoader();
            await update(ref(db, `users/${uid}/equipped`), { title_override: e.target.value || null });
            hideLoader();
            showNotification('Статус обновлен!');
        });
    }
}