import { db, auth, showLoader, hideLoader, showNotification, SHOP_ITEMS_BASE } from './firebase-init.js';
import { ref, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
let SHOP_ITEMS = { ...SHOP_ITEMS_BASE }; 
let ALL_SHOP_ITEMS = {}; 
let currentUser = null;
let isAdmin = false; 
let userInventory = [];
let userEquipped = {};
let currentBalance = 0;
let currentXP = 0;
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadShopConfig(); 
        await loadUserData();
        renderShop();
    } else {
        window.location.href = 'index.html';
    }
});
const loadShopConfig = async () => {
    Object.values(SHOP_ITEMS_BASE).forEach(section => {
        section.forEach(item => {
            ALL_SHOP_ITEMS[item.id] = item;
        });
    });
    const snap = await get(ref(db, 'seasons'));
    const seasons = snap.val();
    if (!seasons) return;
    Object.values(seasons).forEach(season => {
        const id = season.id;
        const rewards = season.rewards;
        const finalTitleId = `s${id}_ttl_fin`;
        const finalTitleItem = { 
            id: finalTitleId, 
            name: `(СЕЗОН ${id}) ${rewards.final_title}`, 
            value: rewards.final_title, 
            price: 0, 
            isSeasonal: true,
            isHidden: true 
        };
        SHOP_ITEMS.titles.push(finalTitleItem);
        ALL_SHOP_ITEMS[finalTitleId] = finalTitleItem;
        if (rewards.lootbox && rewards.lootbox.titles) {
            rewards.lootbox.titles.forEach((t, i) => {
                const itemId = `s${id}_ttl_loot${i+1}`;
                const item = {
                    id: itemId, 
                    name: `(СЕЗОН ${id}) Титул: ${t}`, 
                    value: t, 
                    price: 0, 
                    isSeasonal: true,
                    isHidden: true
                };
                SHOP_ITEMS.titles.push(item);
                ALL_SHOP_ITEMS[itemId] = item;
            });
        }
        if (rewards.lootbox && rewards.lootbox.avatars) {
            rewards.lootbox.avatars.forEach((a, i) => {
                 const itemId = `s${id}_av_loot${i+1}`;
                 const item = {
                    id: itemId, 
                    name: `(СЕЗОН ${id}) Аватар ${i+1}`,
                    src: a, 
                    price: 0, 
                    isSeasonal: true,
                    isHidden: true
                };
                SHOP_ITEMS.avatars.push(item);
                ALL_SHOP_ITEMS[itemId] = item;
            });
        }
    });
};
const loadUserData = async () => {
    showLoader();
    try {
        const roleSnap = await get(ref(db, `roles/${currentUser.uid}`));
        isAdmin = roleSnap.exists() && roleSnap.val() === 'admin';
        const snap = await get(ref(db, `users/${currentUser.uid}`));
        const statsSnap = await get(ref(db, `userStats/${currentUser.uid}`));
        const data = snap.val() || {};
        const adminData = statsSnap.val() || {};
        const stats = data.stats || {};
        currentBalance = stats.balance || 0;
        currentXP = stats.xp || 0;
        
        const normalInv = data.inventory ||[];
        const adminInv = adminData.inventory ||[];
        const eff = new Set(normalInv);
        adminInv.forEach(id => eff.has(id) ? eff.delete(id) : eff.add(id));
        userInventory = Array.from(eff);
        
        userEquipped = data.equipped || {};
        const balanceDisplay = isAdmin ? '∞' : currentBalance;
        document.getElementById('user-balance').textContent = `🪙 ${balanceDisplay}`;
    } catch (e) {
        console.error(e);
    } finally {
        hideLoader();
    }
};
const renderShop = () => {
    renderSection('shop-avatars', SHOP_ITEMS.avatars, 'avatar');
    renderSection('shop-titles', SHOP_ITEMS.titles, 'title');
    renderSection('shop-borders', SHOP_ITEMS.borders, 'border');
    renderAuras();
    renderConsumables();
};
const renderConsumables = async () => {
    let container = document.getElementById('shop-consumables');
    if (!container) {
        const bordersSection = document.getElementById('shop-borders').parentElement;
        const section = document.createElement('section');
        section.innerHTML = '<h2>🕵️ Теневой Рынок</h2><div class="shop-grid" id="shop-consumables"></div>';
        bordersSection.after(section);
        container = document.getElementById('shop-consumables');
    }
    container.innerHTML = '';
    const snap = await get(ref(db, `users/${currentUser.uid}/stats`));
    const stats = snap.val() || {};
    const xp = stats.xp || 0;
    if (xp < 100 && !isAdmin) {
        container.innerHTML = `<p style="color:gray; width:100%;">🚫 Доступ закрыт. Требуется ранг "Стажёр" (100 XP).</p>`;
        return;
    }
    SHOP_ITEMS_BASE.consumables.forEach(item => {
        const card = document.createElement('div');
        card.className = 'shop-card';
        const isOwned = userInventory.includes(item.id);
        let btnHtml = '';
        if (isOwned) {
            btnHtml = `<button class="btn btn-secondary" disabled>Уже в сумке</button>`;
        } else {
            const canAfford = currentBalance >= item.price;
            const disabled = canAfford ? '' : 'disabled';
            btnHtml = `<button class="btn buy-btn" ${disabled} data-price="${item.price}" data-id="${item.id}">Купить ${item.price}🪙</button>`;
        }
        card.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 10px;">${item.name.split(' ')[0]}</div> <!-- Иконка -->
            <h3>${item.name.substring(2)}</h3> <!-- Убираем иконку из названия -->
            <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 10px;">${item.desc}</p>
            ${btnHtml}
        `;
        const buyBtn = card.querySelector('.buy-btn');
        if (buyBtn) buyBtn.addEventListener('click', () => buyItem(item));
        container.appendChild(card);
    });
};
const renderSection = (containerId, items, type) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
        let isOwned = userInventory.includes(item.id);
        if (isAdmin) isOwned = true; 
        if (item.isHidden && !isOwned && !isAdmin) {
            return;
        }
        const canBuy = !item.isHidden; 
        if (item.isBlackMarket) {
            const h = new Date().getHours();
            const isOpen = h >= 22 || h < 6; 
            if (!isAdmin && !isOpen) return;
        }
        const card = document.createElement('div');
        card.className = 'shop-card';
        if (item.isBlackMarket) card.classList.add('black-market-card');
        let visual = '';
        if (type === 'avatar') {
            visual = `<img src="${item.src}" class="shop-visual-img">`;
        }
        if (type === 'title') {
            let specialClass = '';
            let displayText = item.value;
            if (item.value === 'accountant') {
                if (userEquipped.title === 'Счетовод' && userEquipped.title_override) {
                    displayText = userEquipped.title_override;
                } else {
                    if (currentBalance < 500) displayText = "📉 Коплю на булочку";
                    else if (currentBalance < 3000) displayText = "📈 Средний класс";
                    else if (currentBalance < 7000) displayText = "💵 Счетовод";
                    else if (currentBalance < 15000) displayText = "💰 Инвестор столовой";
                    else displayText = "👑 Олигарх 2121";
                }
            }
            else if (item.value === 'Повелитель Света') specialClass = 'special-light';
            else if (item.value === 'Владыка Тьмы') specialClass = 'special-dark';
            visual = `<div class="shop-visual-text ${specialClass}">${displayText}</div>`;
            if (item.value === 'Счетовод') {
                visual += `<div style="font-size:0.65rem; color:var(--accent-color); margin-top:5px; font-weight:bold;">Динамический</div>`;
            }
        }
        if (type === 'border') {
            const complexBorders = ['border-hydro', 'border-perimeter'];
            if (complexBorders.includes(item.class)) {
                let previewClasses = item.class;
                if (item.class === 'border-hydro') previewClasses += ' hydro-liquid';
                if (item.class === 'border-perimeter') previewClasses += ' perimeter-tier-6'; 
                visual = `<div class="shop-visual-box ${previewClasses}" style="
                    border-radius: 50%; 
                    width: 60px; 
                    height: 60px; 
                    overflow: hidden; 
                    position: relative;
                    background: #222;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.8rem; color: #fff; z-index: 1; font-weight: bold;
                ">Текст</div>`;
            } else {
                visual = `<div class="shop-visual-box ${item.class}">Текст</div>`;
            }
        }
        if (type === 'aura') {
            visual =`
            <div style="
                width: 70px; height: 70px; 
                position: relative; 
                display: flex; justify-content: center; align-items: center;
                background: #222; 
                border-radius: 50%;
                margin: 0 auto 10px auto;
                overflow: visible; 
            ">
                <!-- Фейковая аватарка внутри -->
                <div style="width: 40px; height: 40px; background: #555; border-radius: 50%;"></div>
                <!-- Сама аура (ДИНАМИЧЕСКАЯ) -->
                <div style="
                    position: absolute;
                    width: 230%; height: 230%;
                    background-image: url('${item.id}.png');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    animation: spin 20s linear infinite;
                "></div>
            </div>
            <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
            `;
        }
        let isEquipped = false;
        if (type === 'avatar' && userEquipped.avatar === item.src) isEquipped = true;
        if (type === 'title' && userEquipped.title === item.value) isEquipped = true;
        if (type === 'border' && userEquipped.border === item.class) isEquipped = true;
        if (type === 'aura' && userEquipped.aura === item.class) isEquipped = true;
        let btnHtml = '';
        if (isEquipped) {
            btnHtml = `<button class="btn btn-secondary unequip-btn" data-type="${type}">Снять</button>`;
        } else if (isOwned) {
            btnHtml = `<button class="btn equip-btn" data-type="${type}" data-id="${item.id}">Надеть</button>`;
        } else if (canBuy) { 
            const isFree = item.price === 0;
            const canAfford = isFree || currentBalance >= item.price;
            const disabled = canAfford ? '' : 'disabled';
            let priceText = `${item.price}🪙`;
            if (item.price === 0) priceText = 'Награда';
            btnHtml = `<button class="btn buy-btn" ${disabled} data-price="${item.price}" data-id="${item.id}">Купить ${priceText}</button>`;
        } else {
            btnHtml = `<button class="btn btn-secondary" disabled>Эксклюзив</button>`;
        }
        card.innerHTML = `
            ${visual}
            <h3>${item.name}</h3>
            ${btnHtml}
        `;
        const buyBtn = card.querySelector('.buy-btn');
        if (buyBtn) buyBtn.addEventListener('click', () => buyItem(item));
        const equipBtn = card.querySelector('.equip-btn');
        if (equipBtn) equipBtn.addEventListener('click', () => equipItem(item, type));
        const unequipBtn = card.querySelector('.unequip-btn');
        if (unequipBtn) unequipBtn.addEventListener('click', () => unequipItem(type));
        container.appendChild(card);
    });
};
const buyItem = async (item) => {
    if (item.price > 0 && currentBalance < item.price) {
        showNotification('Недостаточно монет!', 'error');
        return;
    }
    if (!confirm(`Купить "${item.name}" за ${item.price} монет?`)) return;
    showLoader();
    try {
        // Достаем ТОЛЬКО купленный инвентарь (чтобы не перенести админские вещи в обычную папку)
        const userSnap = await get(ref(db, `users/${currentUser.uid}/inventory`));
        const currentNormalInv = userSnap.val() || [];
        const newInventory = [...currentNormalInv, item.id];
        
        const updates = {};
        updates[`users/${currentUser.uid}/inventory`] = newInventory;
        if (item.price > 0) {
            const newBalance = currentBalance - item.price;
            updates[`users/${currentUser.uid}/stats/balance`] = newBalance;
            updates[`users/${currentUser.uid}/stats/signature`] = (currentXP * 7) + (newBalance * 3) + 2121;
        }
        await update(ref(db), updates);
        showNotification(`Вы купили ${item.name}!`);
        await loadUserData(); 
        renderShop();
    } catch (e) {
        console.error(e);
        showNotification('Ошибка покупки. Возможно, не хватает прав или монет.', 'error');
    } finally {
        hideLoader();
    }
};
const equipItem = async (item, type) => {
    showLoader();
    try {
        const updates = {};
        if (type === 'avatar') updates[`users/${currentUser.uid}/equipped/avatar`] = item.src;
        if (type === 'title') updates[`users/${currentUser.uid}/equipped/title`] = item.value;
        if (type === 'border') updates[`users/${currentUser.uid}/equipped/border`] = item.class;
        if (type === 'aura') updates[`users/${currentUser.uid}/equipped/aura`] = item.class;
        await update(ref(db), updates);
        showNotification('Успешно надето!');
        await loadUserData();
        renderShop();
    } catch (e) {
        console.error(e);
        showNotification('Ошибка', 'error');
    } finally {
        hideLoader();
    }
};
const unequipItem = async (type) => {
    showLoader();
    try {
        const updates = {};
        updates[`users/${currentUser.uid}/equipped/${type}`] = null;
        await update(ref(db), updates);
        showNotification('Успешно снято!');
        await loadUserData();
        renderShop();
    } catch (e) {
        console.error(e);
        showNotification('Ошибка при снятии предмета', 'error');
    } finally {
        hideLoader();
    }
};
const renderAuras = () => {
    const container = document.getElementById('shop-auras');
    const section = document.getElementById('auras-section');
    const itemsToShow = SHOP_ITEMS_BASE.auras.filter(item => {
        const isOwned = userInventory.includes(item.id);
        if (!item.isHidden || isOwned || isAdmin) {
            return true;
        }
        return false;
    });
    if (itemsToShow.length === 0) {
        section.classList.add('hidden');
        return;
    }
    section.classList.remove('hidden');
    renderSection('shop-auras', itemsToShow, 'aura');
};