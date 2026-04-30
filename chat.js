import { 
    db, auth, showNotification, showLoader, hideLoader, escapeHTML,
    ref, push, update, remove, get, query, limitToLast, onChildAdded, onChildChanged, onChildRemoved, serverTimestamp,
    onAuthStateChanged, orderByChild, equalTo
} from './firebase-init.js';

let currentUser = null;
let isAdmin = false;
let editingMsgId = null;

const chatMessagesEl = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSendMsg = document.getElementById('btn-send-msg');
const editModal = document.getElementById('edit-msg-modal');
const editInput = document.getElementById('edit-msg-input');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

const userCache = {};

const RANKS_CONFIG =[
    { xp: 0, title: "Новичок" },
    { xp: 100, title: "Стажёр" },
    { xp: 500, title: "Корреспондент" },
    { xp: 1500, title: "Журналист" },
    { xp: 4000, title: "Спецкор" },
    { xp: 10000, title: "Мастер пера" },
    { xp: 25000, title: "Легенда" }
];

const getSmartBorderClasses = (borderName, xp, overrideRankTitle = null) => {
    const classes = [borderName];
    const month = new Date().getMonth();
    if (borderName === 'border-hydro') {
        if (month === 11 || month === 0 || month === 1) classes.push('hydro-winter');
        else classes.push('hydro-liquid');
    }
    if (borderName === 'border-perimeter') {
        const rankToTier = { "Новичок":0, "Стажёр":1, "Корреспондент":2, "Журналист":3, "Спецкор":4, "Мастер пера":5, "Легенда":6 };
        let tier = 0;
        if (overrideRankTitle && rankToTier.hasOwnProperty(overrideRankTitle)) tier = rankToTier[overrideRankTitle];
        else {
            const userXP = xp || 0;
            if (userXP >= 100) tier = 1;
            if (userXP >= 500) tier = 2;
            if (userXP >= 1500) tier = 3;
            if (userXP >= 4000) tier = 4;
            if (userXP >= 10000) tier = 5;
            if (userXP >= 25000) tier = 6;
        }
        classes.push(`perimeter-tier-${tier}`);
    }
    return classes;
};

async function getUserProfile(uid) {
    if (userCache[uid]) return userCache[uid];
    try {
        const [userSnap, overrideSnap] = await Promise.all([
            get(ref(db, `users/${uid}`)),
            get(ref(db, `userStats/${uid}`))
        ]);
        const userData = userSnap.val() || {};
        const overrides = overrideSnap.exists() ? overrideSnap.val() : {};
        const equipped = userData.equipped || {};
        const stats = userData.stats || {};
        
        let displayRankTitle = RANKS_CONFIG[0].title;
        const xp = stats.xp || 0;
        for (let i = 0; i < RANKS_CONFIG.length; i++) {
            if (xp >= RANKS_CONFIG[i].xp) displayRankTitle = RANKS_CONFIG[i].title;
            else break;
        }
        if (overrides.rank) displayRankTitle = overrides.rank;

        let titleVal = equipped.title;
        let specialClass = '';
        if (titleVal && titleVal.toString().trim().toLowerCase() === 'accountant') {
            if (equipped.title_override) titleVal = equipped.title_override;
            else {
                const bal = stats.balance || 0;
                if (bal < 500) titleVal = "📉 Коплю на булочку";
                else if (bal < 3000) titleVal = "📈 Средний класс";
                else if (bal < 7000) titleVal = "💵 Счетовод";
                else if (bal < 15000) titleVal = "💰 Инвестор столовой";
                else titleVal = "👑 Олигарх 2121";
            }
        } else if (titleVal === 'Повелитель Света') specialClass = 'special-light';
        else if (titleVal === 'Владыка Тьмы') specialClass = 'special-dark';

        const profile = {
            name: `${userData.firstName || 'Аноним'} ${userData.lastName || ''}`.trim(),
            avatar: equipped.avatar || null,
            border: equipped.border || null,
            aura: equipped.aura || null,
            title: titleVal,
            titleClass: specialClass,
            xp: xp,
            displayRankTitle: displayRankTitle
        };
        userCache[uid] = profile;
        return profile;
    } catch (e) {
        console.error(e);
        return { name: "Неизвестный", avatar: null, border: null, aura: null, title: null, titleClass: '', xp: 0, displayRankTitle: 'Новичок' };
    }
}

const buildMessageHTML = async (msgId, data) => {
    const profile = await getUserProfile(data.uid);
    
    let borderClasses = '';
    if (profile.border) {
        borderClasses = getSmartBorderClasses(profile.border, profile.xp, profile.displayRankTitle).join(' ');
    }
    
    let avatarImg = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👤</div>`;
    if (profile.avatar) {
        avatarImg = `<img src="${escapeHTML(profile.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }

    let titleHTML = '';
    if (profile.title) {
        titleHTML = `<span class="rank-tag title-tag ${profile.titleClass}">${escapeHTML(profile.title)}</span>`;
    }

    const timeString = new Date(data.timestamp || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const editedMark = data.isEdited ? `<span style="font-size:0.75rem; color:var(--secondary-text-color); margin-left:5px;">(изменено)</span>` : '';

    let controls = '';
    if (currentUser && (data.uid === currentUser.uid || isAdmin)) {
        controls = `
            <div class="chat-msg-actions">
                <button class="btn-link edit-msg-btn" data-id="${msgId}" data-text="${escapeHTML(data.text)}" title="Редактировать">✏️</button>
                <button class="btn-link del-msg-btn" data-id="${msgId}" title="Удалить" style="color:var(--danger-color);">🗑</button>
            </div>
        `;
    }

    let formattedText = escapeHTML(data.text).replace(/\n/g, '<br>');

    return `
        <div class="chat-msg-card ${borderClasses}" id="msg-${msgId}" data-uid="${data.uid}">
            <div class="chat-msg-header" onclick="window.openDossier('${data.uid}')">
                <div class="chat-user-info">
                    <div class="feed-avatar-placeholder" style="width:40px; height:40px; border:none; background:transparent;">
                        <div class="aura-container ${profile.aura || ''}">
                            ${avatarImg}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; justify-content:center;">
                        <span class="chat-name" style="font-weight:bold; color:var(--primary-text-color); line-height:1.2;">${escapeHTML(profile.name)}</span>
                        <span style="font-size:0.75rem; color:var(--secondary-text-color);">${timeString}</span>
                    </div>
                </div>
                <div>${titleHTML}</div>
            </div>
            <div class="chat-text-wrapper">
                <div class="chat-text">
                    ${formattedText} ${editedMark}
                </div>
                ${controls}
            </div>
        </div>
    `;
};

const scrollToBottom = () => {
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
};

const initChat = () => {
    chatMessagesEl.innerHTML = '';
    const chatRef = query(ref(db, 'chat_messages'), limitToLast(100));

    onChildAdded(chatRef, async (snapshot) => {
        const data = snapshot.val();
        const html = await buildMessageHTML(snapshot.key, data);
        
        const div = document.createElement('div');
        div.innerHTML = html;
        const card = div.firstElementChild;
        chatMessagesEl.appendChild(card);
        
        attachMessageListeners(card);
        scrollToBottom();
    });

    onChildChanged(chatRef, async (snapshot) => {
        const msgEl = document.getElementById(`msg-${snapshot.key}`);
        if (msgEl) {
            const data = snapshot.val();
            const html = await buildMessageHTML(snapshot.key, data);
            const div = document.createElement('div');
            div.innerHTML = html;
            const newCard = div.firstElementChild;
            msgEl.replaceWith(newCard);
            attachMessageListeners(newCard);
        }
    });

    onChildRemoved(chatRef, (snapshot) => {
        const msgEl = document.getElementById(`msg-${snapshot.key}`);
        if (msgEl) msgEl.remove();
    });
};

const attachMessageListeners = (card) => {
    const editBtn = card.querySelector('.edit-msg-btn');
    const delBtn = card.querySelector('.del-msg-btn');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editingMsgId = editBtn.dataset.id;
            const txt = document.createElement("textarea");
            txt.innerHTML = editBtn.dataset.text;
            editInput.value = txt.value;
            editModal.classList.remove('hidden');
        });
    }

    if (delBtn) {
        delBtn.addEventListener('click', async () => {
            if (confirm("Удалить сообщение?")) {
                await remove(ref(db, `chat_messages/${delBtn.dataset.id}`));
            }
        });
    }
};

const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    
    chatInput.value = '';
    chatInput.style.height = '45px';
    
    try {
        await push(ref(db, 'chat_messages'), {
            uid: currentUser.uid,
            text: text,
            timestamp: serverTimestamp(),
            isEdited: false
        });
    } catch (e) {
        console.error(e);
        showNotification("Ошибка отправки", "error");
    }
};

btnSendMsg.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

chatInput.addEventListener('input', function() {
    this.style.height = '45px';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

saveEditBtn.addEventListener('click', async () => {
    const newText = editInput.value.trim();
    if (!newText || !editingMsgId) return;

    try {
        await update(ref(db, `chat_messages/${editingMsgId}`), {
            text: newText,
            isEdited: true
        });
        editModal.classList.add('hidden');
        editingMsgId = null;
    } catch (e) {
        console.error(e);
        showNotification("Ошибка при сохранении", "error");
    }
});

cancelEditBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
    editingMsgId = null;
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const roleSnap = await get(ref(db, `roles/${user.uid}`));
        isAdmin = roleSnap.exists() && roleSnap.val() === 'admin';
        initChat();
    } else {
        window.location.href = 'index.html';
    }
});

window.openDossier = async (uid) => {
    const modal = document.getElementById('dossier-modal');
    const content = document.getElementById('dossier-content');
    content.innerHTML = '<div style="text-align:center; padding: 20px;">Загрузка досье...</div>';
    modal.classList.remove('hidden');
    try {
        const[userSnap, articlesSnap, statsOverrideSnap] = await Promise.all([
            get(ref(db, `users/${uid}`)),
            get(query(ref(db, 'articles'), orderByChild('authorId'), equalTo(uid))),
            get(ref(db, `userStats/${uid}`))
        ]);
        const user = userSnap.val();
        if (!user) { 
            content.innerHTML = '<div style="text-align:center;">Автор не найден</div>'; 
            return; 
        }
        const stats = user.stats || {};
        const equipped = user.equipped || {};
        const overrides = statsOverrideSnap.exists() ? statsOverrideSnap.val() : {};
        let displayRankTitle = RANKS_CONFIG[0].title;
        const xp = stats.xp || 0;
        for (let i = 0; i < RANKS_CONFIG.length; i++) {
            if (xp >= RANKS_CONFIG[i].xp) {
                displayRankTitle = RANKS_CONFIG[i].title;
            } else {
                break; 
            }
        }
        if (overrides.rank) displayRankTitle = overrides.rank;
        const modalContent = modal.querySelector('.modal-content');
        modalContent.className = 'modal-content';
        let visualClasses = 'dossier-avatar'; 
        if (equipped.border) {
            const borderClasses = getSmartBorderClasses(equipped.border, xp, displayRankTitle);
            visualClasses += ' ' + borderClasses.join(' ');
            modalContent.classList.add(...borderClasses);
        }
        if (equipped.aura) {
            visualClasses += ' ' + equipped.aura;
        }
        let innerImg = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#333; border-radius:50%; font-size:2rem;">👤</div>`;
        if (equipped.avatar) {
            innerImg = `<img src="${escapeHTML(equipped.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
        const avatarHTML = `
            <div class="${visualClasses}" style="
                width: 100px; 
                height: 100px; 
                margin: 0 auto 15px auto; 
                position: relative; 
                overflow: visible; 
                border-radius: 50%;
                border: ${equipped.border ? 'none' : '3px solid var(--border-color)'};
            ">
                <div class="aura-container">
                    ${innerImg}
                </div>
            </div>
        `;
        let titleHTML = '';
        let displayTitle = equipped.title;
        let specialClass = '';
        if (displayTitle) {
            if (displayTitle.toString().toLowerCase() === 'accountant') {
                if (equipped.title_override) {
                    displayTitle = equipped.title_override;
                } else {
                    const bal = stats.balance || 0;
                    if (bal < 500) displayTitle = "📉 Коплю на булочку";
                    else if (bal < 3000) displayTitle = "📈 Средний класс";
                    else if (bal < 7000) displayTitle = "💵 Счетовод";
                    else if (bal < 15000) displayTitle = "💰 Инвестор столовой";
                    else displayTitle = "👑 Олигарх 2121";
                }
            } else if (displayTitle === 'Повелитель Света') {
                specialClass = 'special-light';
            } else if (displayTitle === 'Владыка Тьмы') {
                specialClass = 'special-dark';
            }
            titleHTML = `<span class="rank-tag title-tag ${specialClass}" style="font-size: 0.9rem; padding: 4px 8px;">${escapeHTML(displayTitle)}</span>`;
        }
        let articlesCount = 0;
        if (articlesSnap.exists()) {
            const arts = articlesSnap.val();
            articlesCount = Object.values(arts).filter(a => a.isPublished).length;
        }
        content.innerHTML = `
            <div class="dossier-header">
                ${avatarHTML}
                <div class="dossier-name">${escapeHTML(user.firstName)} ${escapeHTML(user.lastName)}</div>
                <div style="opacity:0.7; font-size: 0.9rem;">${escapeHTML(user.userClass)}</div>
                <div style="margin-top: 10px;">
                    ${titleHTML}
                </div>
            </div>
            <div class="dossier-stats">
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">${stats.xp || 0}</span>
                    <span class="dossier-stat-label">XP</span>
                </div>
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">❤️ ${stats.totalLikes || 0}</span>
                    <span class="dossier-stat-label">Репутация</span>
                </div>
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">📝 ${articlesCount}</span>
                    <span class="dossier-stat-label">Статей</span>
                </div>
            </div>
        `;
    } catch (e) {
        console.error(e);
        content.innerHTML = '<div style="text-align:center; color:red;">Ошибка загрузки данных</div>';
    }
};