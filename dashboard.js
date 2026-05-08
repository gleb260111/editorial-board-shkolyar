import { 
    db, auth, showLoader, hideLoader, showNotification, escapeHTML, SHOP_ITEMS_BASE,
    ref, onValue, push, set, remove, update, query, orderByChild, equalTo, serverTimestamp, get, limitToLast, runTransaction,
    signOut, onAuthStateChanged 
} from './firebase-init.js';
let currentUserProfile = null; 
const getSmartBorderClasses = (borderName, xp, overrideRankTitle = null) => {
    const classes = [borderName];
    const month = new Date().getMonth();
    if (borderName === 'border-hydro') {
        if (month === 11 || month === 0 || month === 1) {
            classes.push('hydro-winter');
        } else {
            classes.push('hydro-liquid');
        }
    }
    if (borderName === 'border-perimeter') {
        const rankToTier = {
            "Новичок": 0,
            "Стажёр": 1,
            "Корреспондент": 2,
            "Журналист": 3,
            "Спецкор": 4,
            "Мастер пера": 5,
            "Легенда": 6
        };
        let tier = 0;
        if (overrideRankTitle && rankToTier.hasOwnProperty(overrideRankTitle)) {
            tier = rankToTier[overrideRankTitle];
        } else {
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
const RANKS_CONFIG = [
    { xp: 0, title: "Новичок" },
    { xp: 100, title: "Стажёр" },        
    { xp: 500, title: "Корреспондент" }, 
    { xp: 1500, title: "Журналист" },    
    { xp: 4000, title: "Спецкор" },      
    { xp: 10000, title: "Мастер пера" }, 
    { xp: 25000, title: "Легенда" }      
];
const ACHIEVEMENTS_CONFIG = [
    { id: 'first_step', icon: '🏁', title: 'Первый шаг', desc: 'Подать 1 статью', check: (stats, arts, data) => arts.length >= 1 },
    { id: 'on_fire', icon: '🔥', title: 'В ударе', desc: 'Подать 5 статей', check: (stats, arts, data) => arts.length >= 5 },
    { id: 'veteran', icon: '🎓', title: 'Профи', desc: 'Подать 10 статей', check: (stats, arts, data) => arts.length >= 10 },
    { id: 'legend_club', icon: '💎', title: 'Юбиляр', desc: 'Подать 25 статей', check: (stats, arts, data) => arts.length >= 25 },
    { id: 'trusted', icon: '🤝', title: 'Любимчик редакции', desc: '3 опубликованные статьи', check: (stats, arts, data) => arts.filter(a => a.isPublished).length >= 3 },
    { id: 'news_machine', icon: '⚡', title: 'Машина новостей', desc: '3 статьи за один день', check: (stats, arts, data) => {
        const dates = {};
        arts.forEach(a => {
            const d = new Date(a.createdAt).toLocaleDateString();
            dates[d] = (dates[d] || 0) + 1;
        });
        return Object.values(dates).some(count => count >= 3);
    }},
    { id: 'night_owl', icon: '🦉', title: 'Ночная сова', desc: 'Подать статью с 00:00 до 05:00', check: (stats, arts, data) => arts.some(a => {
        const h = new Date(a.createdAt).getHours();
        return h >= 0 && h < 5;
    })},
    { id: 'early_bird', icon: '🌅', title: 'Жаворонок', desc: 'Подать статью с 06:00 до 09:00', check: (stats, arts, data) => arts.some(a => {
        const h = new Date(a.createdAt).getHours();
        return h >= 6 && h <= 9;
    })},
    { id: 'weekend', icon: '📅', title: 'Постоянство', desc: 'Подать статью в субботу или воскресенье', check: (stats, arts, data) => arts.some(a => {
        const d = new Date(a.createdAt).getDay();
        return d === 0 || d === 6;
    })},
    { id: 'deadline_master', icon: '⏰', title: 'Дедлайн-мастер', desc: 'Подать статью с 23:50 до 23:59', check: (stats, arts, data) => arts.some(a => {
        const h = new Date(a.createdAt).getHours();
        const m = new Date(a.createdAt).getMinutes();
        return h === 23 && m >= 50;
    })},
    { id: 'tolstoy', icon: '📜', title: 'Лев Толстой', desc: 'Написать статью длиннее 3000 символов', check: (stats, arts, data) => arts.some(a => a.text.length > 3000) },
    { id: 'clickbait', icon: '📢', title: 'Громкий заголовок', desc: 'Написать заголовок с "!" или "?"', check: (stats, arts, data) => arts.some(a => a.title.includes('!') || a.title.includes('?')) },
    { id: 'school_patriot', icon: '🏫', title: 'Школьный патриот', desc: 'Написать про школу, учителей или уроки', check: (stats, arts, data) => arts.some(a => {
        const text = (a.text + a.title).toLowerCase();
        return /школ|учител|урок|класс|экзамен|директор/i.test(text);
    })},
    { id: 'shopping_spree', icon: '🛍️', title: 'Шопоголик', desc: 'Купить 5 предметов в магазине', check: (stats, arts, data) => (data.inventory || []).length >= 5 },
    { id: 'collector', icon: '🖼️', title: 'Коллекционер', desc: 'Скупить все стандартные аватарки', check: (stats, arts, data) => {
            const standardAvatars = SHOP_ITEMS_BASE.avatars
                .filter(a => !a.isHidden)
                .map(a => a.id);
            const userInventory = data.inventory || [];
            return standardAvatars.every(id => userInventory.includes(id));
        }
    },
    { id: 'public_favorite', icon: '❤️‍🔥', title: 'Любимец публики', desc: 'Собрать 50 лайков на всех своих статьях', check: (stats, arts, data) => (stats.totalLikes || 0) >= 50 },
    { id: 'company_soul', icon: '🥳', title: 'Душа компании', desc: 'Собрать 10 лайков на одной статье', check: (stats, arts, data) => arts.some(a => (a.likeCount || 0) >= 10) },
    { id: 'sensei', icon: '🥋', title: 'Сенсей', desc: 'Довести до публикации 3 статьи учеников', check: (stats, arts, data) => (stats.menteePublishedCount || 0) >= 3 },
    { id: 'scrooge', icon: '🤑', title: 'Дядя Скрудж', desc: 'Накопить 10 000 монет на балансе', check: (stats, arts, data) => (stats.balance || 0) >= 10000 },
    { id: 'stylist', icon: '✨', title: 'Икона стиля', desc: 'Собрать в инвентаре аватарку, рамку, титул и ауру', check: (stats, arts, data) => {
        const inv = data.inventory ||[];
        const hasAvatar = inv.some(id => SHOP_ITEMS_BASE.avatars?.some(i => i.id === id) || id.includes('_av_'));
        const hasTitle = inv.some(id => SHOP_ITEMS_BASE.titles?.some(i => i.id === id) || id.includes('_ttl_'));
        const hasBorder = inv.some(id => SHOP_ITEMS_BASE.borders?.some(i => i.id === id));
        const hasAura = inv.some(id => SHOP_ITEMS_BASE.auras?.some(i => i.id === id));
        return hasAvatar && hasTitle && hasBorder && hasAura;
    }},
    { id: 'photographer', icon: '📸', title: 'Папарацци', desc: 'Прикрепить к одной статье 3 или более фото', check: (stats, arts, data) => arts.some(a => a.images && a.images.length >= 3) },
    { id: 'co_author', icon: '👥', title: 'Командный игрок', desc: 'Написать статью в соавторстве', check: (stats, arts, data) => arts.some(a => a.authorName && (a.authorName.includes(',') || a.authorName.toLowerCase().includes(' и '))) }
];
let ALL_SHOP_ITEMS = {}; 
let userRole = 'editor';

// --- Логика "Сложных систем" (Новая экономика) ---
const calculateArticleRewards = (text = '') => {
    const length = text.length;
    
    // --- Расчет XP ---
    // Считаем уникальные слова длиннее 3 букв для индекса сложности
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const uniqueWords = new Set(words).size;
    const complexityIndex = words.length > 0 ? (uniqueWords / words.length) : 0;
    
    // XP: База 65 + (длина * 0.15) + индекс сложности (бонус до 60 XP)
    const xp = Math.round(65 + (length * 0.15) + (complexityIndex * 60));
    
    // --- Расчет Монет ---
    // Coins: База 25 + (длина * 0.125)
    const coins = Math.round(25 + (length * 0.125));
    
    return { xp, coins };
};

const getInventoryTotalCost = (inventory =[]) => {
    let total = 0;
    let safeShopItems = [];
    if (typeof SHOP_ITEMS_BASE !== 'undefined') {['avatars', 'titles', 'borders', 'consumables', 'auras'].forEach(cat => {
            if (SHOP_ITEMS_BASE[cat]) safeShopItems = safeShopItems.concat(SHOP_ITEMS_BASE[cat]);
        });
    }
    if (typeof ALL_SHOP_ITEMS !== 'undefined') {
        Object.values(ALL_SHOP_ITEMS).forEach(item => {
            if (!safeShopItems.find(i => i.id === item.id)) safeShopItems.push(item);
        });
    }
    inventory.forEach(itemId => {
        const item = safeShopItems.find(i => i.id === itemId);
        if (item && item.price) total += item.price;
    });
    return total;
};
let currentEditingId = null;
const SORT_MODE_KEY = 'editorialBoardSortMode';
let currentSortMode = localStorage.getItem(SORT_MODE_KEY) || 'submission';
const articlesRef = ref(db, 'articles');
const MIN_TEXTAREA_HEIGHT = 180;
let currentLimit = 10; 
const mainHeader = document.getElementById('main-header');
const logoutBtn = document.getElementById('logout-btn');
const mainContent = document.getElementById('main-content');
const formWrapper = document.getElementById('form-wrapper'); 
const articleFormSection = document.getElementById('article-form-section');
const articleForm = document.getElementById('article-form');
const createArticleBtn = document.getElementById('create-article-btn');
const fabCreateBtn = document.getElementById('fab-create-btn');
const textTextarea = document.getElementById('text');
const toggleTextBtn = document.getElementById('toggle-text-btn');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const articlesListHeader = document.getElementById('articles-list-header');
const articlesContainer = document.getElementById('articles-container');
const adminControls = document.getElementById('admin-controls');
const cleanupBtn = document.getElementById('cleanup-btn');
const sortBySubmissionBtn = document.getElementById('sort-by-submission-btn');
const sortByPublicationBtn = document.getElementById('sort-by-publication-btn');
const imageInputsContainer = document.getElementById('image-inputs-container');
const addImageInputBtn = document.getElementById('add-image-input-btn');
const checkTextareaOverflow = () => {
    const hasOverflow = textTextarea.scrollHeight > MIN_TEXTAREA_HEIGHT;
    toggleTextBtn.classList.toggle('hidden', !hasOverflow);
    if (!hasOverflow && textTextarea.dataset.expanded === 'true') {
        textTextarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
        toggleTextBtn.textContent = 'Развернуть';
        textTextarea.dataset.expanded = 'false';
    }
};
const addImageInput = (value = '') => {
    const div = document.createElement('div');
    div.className = 'image-input-row';
    const input = document.createElement('input');
    input.type = 'url';
    input.placeholder = 'https://...';
    input.value = value;
    input.required = false; 
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-image-btn';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Удалить поле';
    removeBtn.onclick = () => div.remove();
    div.appendChild(input);
    div.appendChild(removeBtn);
    imageInputsContainer.appendChild(div);
};
const toggleTextareaSize = () => {
    const isExpanded = textTextarea.dataset.expanded === 'true';
    if (isExpanded) {
        textTextarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
        toggleTextBtn.textContent = 'Развернуть';
    } else {
        textTextarea.style.height = `${textTextarea.scrollHeight}px`;
        toggleTextBtn.textContent = 'Свернуть';
    }
    textTextarea.dataset.expanded = !isExpanded;
};
const openModal = () => {
    formWrapper.classList.add('modal-overlay');
    articleFormSection.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
};
const closeModal = () => {
    formWrapper.classList.remove('modal-overlay');
    articleFormSection.classList.add('hidden');
    document.body.style.overflow = ''; 
    resetForm();
};
const resetForm = () => {
    articleForm.reset();
    document.getElementById('articleId').value = '';
    currentEditingId = null;
    imageInputsContainer.innerHTML = '';
    addImageInput(); 
    formTitle.textContent = 'Подать новую статью';
    submitBtn.textContent = 'Отправить';
    cancelEditBtn.classList.remove('hidden');
    if (currentUserProfile) {
        document.getElementById('authorName').value = `${currentUserProfile.lastName} ${currentUserProfile.firstName}`;
        document.getElementById('authorClass').value = currentUserProfile.userClass;
    }
    textTextarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
    textTextarea.dataset.expanded = 'false';
};
const renderConsumablesSelector = async () => {
    const container = document.getElementById('consumables-container');
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('hidden');
    if (currentEditingId) return;
    if (!auth.currentUser) return;
    
    const[userSnap, adminSnap] = await Promise.all([
        get(ref(db, `users/${auth.currentUser.uid}/inventory`)),
        get(ref(db, `userStats/${auth.currentUser.uid}/inventory`))
    ]);
    
    // Переписал безопасно, чтобы генератор не обрезал код
    const userArr = userSnap.val() ? userSnap.val() : new Array();
    const adminArr = adminSnap.val() ? adminSnap.val() : new Array();
    const eff = new Set(userArr);
    adminArr.forEach(id => eff.has(id) ? eff.delete(id) : eff.add(id));
    const inventory = Array.from(eff);
    
    const availableItems = SHOP_ITEMS_BASE.consumables.filter(i => inventory.includes(i.id));
    if (availableItems.length > 0) {
        container.classList.remove('hidden');
        container.innerHTML = '<label style="margin-bottom:10px; display:block;">Использовать предметы:</label>';
        availableItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'consumables-label';
            div.innerHTML = `
                <input type="checkbox" id="use-${item.id}" value="${item.id}">
                <label for="use-${item.id}" style="cursor:pointer;">${item.name}</label>
            `;
            container.appendChild(div);
        });
    }
};
const handleCreateClick = () => {
    resetForm();
    openModal(); 
};
const handleEdit = (article) => {
    currentEditingId = article.id;
    document.getElementById('articleId').value = article.id;
    document.getElementById('title').value = article.title;
    document.getElementById('text').value = article.text;
    document.getElementById('authorName').value = article.authorName;
    document.getElementById('authorClass').value = article.authorClass;
    imageInputsContainer.innerHTML = '';
    if (article.images && Array.isArray(article.images) && article.images.length > 0) {
        article.images.forEach(url => addImageInput(url));
    } else if (article.image) {
        addImageInput(article.image);
    } else {
        addImageInput();
    }
    formTitle.textContent = 'Редактирование статьи';
    submitBtn.textContent = 'Сохранить изменения';
    if (userRole === 'editor') {
        articleFormSection.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');
        articleFormSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        openModal();
    }
    setTimeout(checkTextareaOverflow, 50);
};
const handleCancelEdit = () => {
    closeModal();
};
const calculateAndRenderStats = async (allArticles) => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const statsSection = document.getElementById('user-stats-section');
        if (!statsSection) return;
        const [userSnap, overrideSnap, myArticlesSnap] = await Promise.all([
            get(ref(db, `users/${currentUser.uid}`)),
            get(ref(db, `userStats/${currentUser.uid}`)),
            get(query(ref(db, 'articles'), orderByChild('authorId'), equalTo(currentUser.uid)))
        ]);
        const userData = userSnap.val() || {};
        const overrides = overrideSnap.exists() ? overrideSnap.val() : {};
        const storedStats = userData.stats || {};
        const equipped = userData.equipped || {};
        let myArticles =[];
        if (myArticlesSnap.exists()) {
            myArticles = Object.values(myArticlesSnap.val());
        }
        
        let finalXP = storedStats.xp || 0; 
        const currentBalance = storedStats.balance || 0;
        let dbLastXpGain = storedStats.lastXpGain || 0;
        
        myArticles.forEach(article => {
            if (article.isPublished && article.publishAt && article.publishAt > dbLastXpGain) {
                dbLastXpGain = article.publishAt;
            }
        });
        
        const totalLikes = storedStats.totalLikes || 0;
        statsSection.classList.remove('hidden');
        let realRankTitle = RANKS_CONFIG[0].title;
        let rankIndex = 0;
        for (let i = 0; i < RANKS_CONFIG.length; i++) {
            if (finalXP >= RANKS_CONFIG[i].xp) {
                realRankTitle = RANKS_CONFIG[i].title;
                rankIndex = i;
            } else break;
        }
        let displayRankTitle = overrides.rank ? overrides.rank : realRankTitle;
        const avatarEl = document.getElementById('user-avatar');
        avatarEl.className = 'user-avatar-placeholder'; 
        let avatarImg = `<span>👤</span>`;
        if (equipped.avatar) {
            avatarImg = `<img src="${escapeHTML(equipped.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
        avatarEl.innerHTML = `<div class="aura-container">${avatarImg}</div>`;
        const auraContainer = avatarEl.querySelector('.aura-container');
        if (equipped.border) {
            const smartClasses = getSmartBorderClasses(equipped.border, finalXP, displayRankTitle);
            avatarEl.classList.add(...smartClasses);
        }
        if (equipped.aura) auraContainer.classList.add(equipped.aura);
        if (equipped.aura_reverse) auraContainer.classList.add(equipped.aura_reverse);
        document.getElementById('stats-username').textContent =
            (userData.firstName ? `${userData.lastName} ${userData.firstName}` : currentUser.email.split('@')[0]);
        const elRank = document.getElementById('stats-rank');
        let titleText = equipped.title;
        let specialClass = '';
        if (titleText && titleText.toString().trim().toLowerCase() === 'accountant') {
            if (equipped.title_override) {
                titleText = equipped.title_override;
            } else {
                const bal = currentBalance || 0;
                if (bal < 500) titleText = "📉 Коплю на булочку";
                else if (bal < 3000) titleText = "📈 Средний класс";
                else if (bal < 7000) titleText = "💵 Счетовод"; 
                else if (bal < 15000) titleText = "💰 Инвестор столовой";
                else titleText = "👑 Олигарх 2121";
            }
        }
        else if (titleText === 'Повелитель Света') specialClass = 'special-light';
        else if (titleText === 'Владыка Тьмы') specialClass = 'special-dark';
        let rankHTML = `<span style="font-weight:700;">${escapeHTML(displayRankTitle)}</span>`;
        if (titleText) {
            rankHTML += ` | <span class="rank-tag title-tag ${specialClass}" style="margin-left:5px; font-size:0.8em;">${escapeHTML(titleText)}</span>`;
        }
        if (overrides.rank) {
            elRank.style.color = "var(--accent-color)";
            elRank.style.borderColor = "var(--accent-color)";
        } else {
            elRank.style.color = "";
            elRank.style.borderColor = "";
        }
        let balanceDisplay = userRole === 'admin' ? '∞' : currentBalance;
        elRank.innerHTML = `
            ${rankHTML}
            <span style="margin-left:10px; font-size:0.9em; opacity:0.8;">❤️ ${totalLikes}</span>
            <span style="margin-left:8px; color: #ffd700; font-weight:bold;">🪙 ${balanceDisplay}</span>
        `;
        const tamagochiImg = document.getElementById('tamagochi-image');
        const moodIcon = document.getElementById('tamagochi-mood-icon');
        if (tamagochiImg) {
            const imgNum = Math.min(rankIndex + 1, 7);
            tamagochiImg.src = `tamagochi${imgNum}.png`;
            const timeSince = Date.now() - dbLastXpGain;
            const happyTime = 2 * 24 * 60 * 60 * 1000; 
            if (finalXP === 0) { 
                moodIcon.textContent = "🥚"; 
                tamagochiImg.classList.remove('tamagochi-happy'); 
            }
            else if (timeSince < happyTime) { 
                moodIcon.textContent = "🥰"; 
                tamagochiImg.classList.add('tamagochi-happy'); 
            }
            else { 
                moodIcon.textContent = "🥺"; 
                tamagochiImg.classList.remove('tamagochi-happy'); 
            }
        }
        const progressBar = document.getElementById('rank-progress');
        const progressText = document.getElementById('progress-text');
        const nextRankName = document.getElementById('next-rank-name');
        let nextRankObj = RANKS_CONFIG[rankIndex + 1];
        if (progressBar) {
            if (!nextRankObj) {
                progressBar.style.width = '100%';
                progressText.textContent = `${finalXP} XP`;
                nextRankName.textContent = 'Максимум!';
            } else {
                const percent = Math.min(100, Math.max(0, Math.round((finalXP / nextRankObj.xp) * 100)));
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${finalXP} / ${nextRankObj.xp} XP`;
                nextRankName.textContent = `До: ${nextRankObj.title}`;
            }
        }
        const achievementsGrid = document.getElementById('achievements-grid');
        if (achievementsGrid && typeof ACHIEVEMENTS_CONFIG !== 'undefined') {
            achievementsGrid.innerHTML = '';
            
            // Безопасное объединение инвентарей без сложных скобок
            const normalInv = userData.inventory ? userData.inventory : new Array();
            const adminInv = overrides.inventory ? overrides.inventory : new Array();
            
            // XOR объединение (чтобы конфискованные админом вещи не засчитывались в ачивках)
            const effSet = new Set(normalInv);
            adminInv.forEach(id => effSet.has(id) ? effSet.delete(id) : effSet.add(id));
            
            // Создаем копию даты для проверки, подкидывая туда актуальный инвентарь
            const dataForChecks = Object.assign({}, userData);
            dataForChecks.inventory = Array.from(effSet);

            const unlockedList = new Array();
            
            // Проверяем ачивки В ЛЮБОМ СЛУЧАЕ (даже если 0 статей)
            ACHIEVEMENTS_CONFIG.forEach(ach => { 
                if(ach.check(storedStats, myArticles, dataForChecks)) {
                    unlockedList.push(ach.id);
                }
            });
            
            const forced = overrides.achievements || {};
            ACHIEVEMENTS_CONFIG.forEach(ach => {
                const isUnlocked = unlockedList.includes(ach.id) || forced[ach.id];
                const div = document.createElement('div');
                if (isUnlocked) {
                    div.className = 'achievement-item unlocked';
                    if (forced[ach.id]) div.style.borderColor = 'var(--accent-color)';
                    div.title = ach.desc;
                    div.innerHTML = `<span class="achievement-icon">${ach.icon}</span> <span>${ach.title}</span>`;
                } else if (userRole === 'admin') {
                    div.className = 'achievement-item locked admin-visible';
                    div.title = ach.desc;
                    div.innerHTML = `<span class="achievement-icon" style="filter: grayscale(1);">${ach.icon}</span> <span>${ach.title}</span>`;
                } else {
                    div.className = 'achievement-item locked';
                    div.title = "Секретно";
                }
                achievementsGrid.appendChild(div);
            });
        }
    } catch (e) {
        console.error("Ошибка статистики:", e);
    }
};
let auditRunning = false;
const startSecurityMonitor = () => {
    if (userRole === 'admin') {
        console.log("👑 Обнаружен Главред. Анти-чит отключен для этого аккаунта.");
        return; 
    }
    const uid = auth.currentUser.uid;
    onValue(ref(db, `users/${uid}`), async (snapshot) => {
        if (auditRunning) return; 
        const data = snapshot.val() || {};
        const inventory = data.inventory ? data.inventory : new Array();
        const equipped = data.equipped || {};
        const stats = data.stats || {};
        
        // Вычисляем, сколько пользователь МОГ потратить легально
        // (Всего заработано минус то, что осталось на балансе)
        const totalEarned = stats.totalCoinsEarned || 0;
        const currentBalance = stats.balance || 0;
        const validSpent = Math.max(0, totalEarned - currentBalance);
        
        // Получаем админские модификаторы инвентаря (XOR)
        const overrideSnap = await get(ref(db, `userStats/${uid}`));
        const adminInv = overrideSnap.exists() && overrideSnap.val().inventory ? overrideSnap.val().inventory : new Array();

        // Вычисляем Эффективный Инвентарь (то, что реально доступно юзеру)
        const effSet = new Set(inventory);
        adminInv.forEach(id => effSet.has(id) ? effSet.delete(id) : effSet.add(id));
        const effectiveInventory = Array.from(effSet);

        let safeShopItems = new Array();
        if (typeof SHOP_ITEMS_BASE !== 'undefined') {
            if (SHOP_ITEMS_BASE.avatars) safeShopItems = safeShopItems.concat(SHOP_ITEMS_BASE.avatars);
            if (SHOP_ITEMS_BASE.titles) safeShopItems = safeShopItems.concat(SHOP_ITEMS_BASE.titles);
            if (SHOP_ITEMS_BASE.borders) safeShopItems = safeShopItems.concat(SHOP_ITEMS_BASE.borders);
            if (SHOP_ITEMS_BASE.consumables) safeShopItems = safeShopItems.concat(SHOP_ITEMS_BASE.consumables);
            if (SHOP_ITEMS_BASE.auras) safeShopItems = safeShopItems.concat(SHOP_ITEMS_BASE.auras);
        }
        if (typeof ALL_SHOP_ITEMS !== 'undefined') {
            Object.values(ALL_SHOP_ITEMS).forEach(item => {
                if (!safeShopItems.find(i => i.id === item.id)) safeShopItems.push(item);
            });
        }
        safeShopItems.push({ id: 'frame_event_horizon', price: 0 });

        let realCost = 0;
        let cheatingDetected = false;
        const updates = {};

        // Проверяем экипировку по Эффективному Инвентарю (с учетом подарков и конфискаций)
        const checkEquipped = (type, propName, itemProp) => {
            if (equipped[type]) {
                const item = safeShopItems.find(i => i[itemProp] === equipped[type]);
                if (!item || !effectiveInventory.includes(item.id)) {
                    console.warn(`🚨 ПОЛИЦИЯ: Нелегально надет ${type}!`);
                    updates[`users/${uid}/equipped/${type}`] = null;
                    cheatingDetected = true;
                }
            }
        };
        checkEquipped('avatar', 'src', 'src');
        checkEquipped('title', 'value', 'value');
        checkEquipped('border', 'class', 'class');
        checkEquipped('aura', 'class', 'class');
        
        if (equipped['aura_reverse']) {
            const baseClass = equipped['aura_reverse'].replace('-rev', '');
            const item = safeShopItems.find(i => i.class === baseClass);
            if (!item || !effectiveInventory.includes(item.id)) {
                console.warn(`🚨 ПОЛИЦИЯ: Нелегально надет aura_reverse!`);
                updates[`users/${uid}/equipped/aura_reverse`] = null;
                cheatingDetected = true;
            }
        }

        // Считаем реальную стоимость купленного инвентаря (папка users)
        inventory.forEach(itemId => {
            const item = safeShopItems.find(i => i.id === itemId);
            if (item) {
                realCost += (item.price || 0);
            } else if (!item && !itemId.startsWith('s') && itemId !== 'frame_event_horizon') {
                console.warn(`🚨 ПОЛИЦИЯ: Неизвестный предмет в инвентаре: ${itemId}`);
                cheatingDetected = true;
            }
        });
        
        // Если вещей больше, чем он мог купить = КРАЖА!
        if (realCost > validSpent + 5) {
            console.warn(`🚨 КРАЖА! Вещей на ${realCost}, а легально мог потратить только ${validSpent}`);
            cheatingDetected = true;
        }

        if (cheatingDetected) {
            auditRunning = true; 
            console.log("🧹 Очистка аккаунта...");
            showNotification("Обнаружены некорректные данные. Инвентарь конфискован.", "error");
            
            // Оставляем только бесплатные вещи (подарки админа живут в userStats, так что они в безопасности)
            const cleanInventory = inventory.filter(id => {
                 const i = safeShopItems.find(item => item.id === id);
                 return i && i.price === 0;
            });
            updates[`users/${uid}/inventory`] = cleanInventory;
            
            try {
                await update(ref(db), updates);
            } catch(e) {
                console.error("Не удалось очистить:", e);
            } finally {
                setTimeout(() => { auditRunning = false; }, 2000);
            }
        }
    });
};
const handleFormSubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const text = document.getElementById('text').value.trim();
    const authorName = document.getElementById('authorName').value.trim();
    const authorClass = document.getElementById('authorClass').value.trim();
    const imageInputs = imageInputsContainer.querySelectorAll('input');
    const imagesArray = [];
    imageInputs.forEach(input => {
        const url = input.value.trim();
        if (url) imagesArray.push(url);
    });
    if (!title || !text || !authorName || !authorClass) {
        showNotification('Заполните все поля!', 'error');
        return;
    }
    const articleData = { 
        title, 
        text, 
        authorName, 
        authorClass,
        images: imagesArray,
        image: null
    };
    showLoader();
    try {
        if (currentEditingId) {
            await update(ref(db, `articles/${currentEditingId}`), articleData);
            showNotification('Обновлено!');
        } else {
            const currentUser = auth.currentUser;
            await set(push(articlesRef), { 
                ...articleData, 
                authorId: currentUser.uid, 
                createdAt: serverTimestamp(), 
                isPublished: false, 
                preventDeletion: false,
                likeCount: 0
            });
            showNotification('Статья отправлена!');
        }
        closeModal(); 
        await fetchArticles();
    } catch (error) {
        console.error("Ошибка:", error);
        showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
};
const handleDelete = async (id) => {
    if (!confirm('Вы уверены? Если статья была опубликована, полученные за неё опыт и монеты будут списаны с вашего баланса.')) return;
    showLoader();
    try {
        const artSnap = await get(ref(db, `articles/${id}`));
        const article = artSnap.val();
        
        const updates = {};
        updates[`articles/${id}`] = null; // Удаляем статью

        // Если статья уже принесла автору награду, высчитываем её и отнимаем
        if (article && article.isRewarded) {
            const authorSnap = await get(ref(db, `users/${article.authorId}`));
            const authorData = authorSnap.val() || {};
            const stats = authorData.stats || { xp: 0, balance: 0 };
            
            const rewards = calculateArticleRewards(article.text || '');
            const newXp = Math.max(0, (stats.xp || 0) - rewards.xp);
            const newBalance = Math.max(0, (stats.balance || 0) - rewards.coins);
            const newTotalCoins = Math.max(0, (stats.totalCoinsEarned || 0) - rewards.coins);
            
            // Пересчитываем обязательную подпись
            const signature = (newXp * 7) + (newBalance * 3) + 2121;

            updates[`users/${article.authorId}/stats/xp`] = newXp;
            updates[`users/${article.authorId}/stats/balance`] = newBalance;
            updates[`users/${article.authorId}/stats/totalCoinsEarned`] = newTotalCoins;
            updates[`users/${article.authorId}/stats/signature`] = signature;
        }

        await update(ref(db), updates);
        showNotification('Статья удалена (баланс и опыт скорректированы).');
        await fetchArticles();
    } catch (error) {
        console.error(error);
        showNotification('Ошибка при удалении. Возможно, недостаточно прав.', 'error');
    } finally {
        hideLoader();
    }
};
const handlePublishDateChange = async (id, dateString, card) => {
    showLoader();
    try {
        const publishTimestamp = dateString ? new Date(dateString).getTime() : null;
        const isPublished = !!dateString;
        const artSnap = await get(ref(db, `articles/${id}`));
        const article = artSnap.val();
        if (!article) throw new Error("Статья не найдена");
        const updates = {};
        updates[`articles/${id}/publishAt`] = publishTimestamp;
        updates[`articles/${id}/isPublished`] = isPublished;
        
        // Проверяем: если публикуется впервые (!article.isRewarded)
        if (isPublished && publishTimestamp && !article.isRewarded) {
            const authorSnap = await get(ref(db, `users/${article.authorId}`));
            const authorData = authorSnap.val() || {};
            const stats = authorData.stats || { xp: 0, balance: 0 };
            
            const rewards = calculateArticleRewards(article.text || '');
            const newXp = (stats.xp || 0) + rewards.xp;
            const newBalance = (stats.balance || 0) + rewards.coins;
            const newTotalCoins = (stats.totalCoinsEarned || 0) + rewards.coins;
            const signature = (newXp * 7) + (newBalance * 3) + 2121;

            updates[`users/${article.authorId}/stats/xp`] = newXp;
            updates[`users/${article.authorId}/stats/balance`] = newBalance;
            updates[`users/${article.authorId}/stats/totalCoinsEarned`] = newTotalCoins;
            updates[`users/${article.authorId}/stats/signature`] = signature;
            updates[`users/${article.authorId}/stats/lastXpGain`] = publishTimestamp;
            
            // Ставим флаг, что награда выдана
            updates[`articles/${id}/isRewarded`] = true;
        }
        
        await update(ref(db), updates);
        const statusElement = card.querySelector('.article-meta span:nth-of-type(3)');
        if (statusElement) {
            const newStatusText = isPublished 
                ? `Опубликовать: ${new Date(publishTimestamp).toLocaleDateString('ru-RU')}` 
                : 'Не опубликовано';
            statusElement.textContent = `Статус: ${newStatusText}`;
        }
        showNotification(isPublished ? 'Статья опубликована! Дата обновлена.' : 'Публикация отменена.');
    } catch (error) {
        console.error(error);
        showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
};
const handlePreventDeletionChange = async (id, isChecked) => {
    showLoader();
    try {
        await update(ref(db, `articles/${id}`), { preventDeletion: isChecked });
    } catch (error) {
        showNotification('Ошибка при изменении статуса защиты.', 'error');
    } finally {
        hideLoader();
    }
};
const handleCleanup = async () => {
    if (!confirm('Вы уверены, что хотите удалить все опубликованные статьи старше 7 дней (кроме защищенных)?')) return;
    showLoader();
    try {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const snapshot = await get(articlesRef);
        const allArticles = snapshot.val() || {};
        const updates = {};
        let deletedCount = 0;
        for (const id in allArticles) {
            const article = allArticles[id];
            if (article.isPublished && article.publishAt < sevenDaysAgo && !article.preventDeletion) {
                updates[`articles/${id}`] = null;
                deletedCount++;
            }
        }
        if (deletedCount > 0) {
            await update(ref(db), updates);
            showNotification(`Чистка завершена. Удалено статей: ${deletedCount}.`);
            await fetchArticles();
        } else {
            showNotification('Статей для чистки не найдено.', 'info');
        }
    } catch (error) {
        showNotification('Ошибка во время чистки.', 'error');
    } finally {
        hideLoader();
    }
};
const handleLogout = () => { signOut(auth); };
const seasonSection = document.getElementById('season-section');
const lootbox1Btn = document.getElementById('lootbox1-btn');
const lootbox2Btn = document.getElementById('lootbox2-btn');
const finalRewardBtn = document.getElementById('final-reward-btn');
const adminSeasonBtn = document.getElementById('admin-season-btn');
let activeSeason = null;
let seasonArticlesCount = 0;
let userSeasonData = {}; 
const initSeasons = async () => {
    Object.values(SHOP_ITEMS_BASE).forEach(section => {
        section.forEach(item => {
            ALL_SHOP_ITEMS[item.id] = item;
        });
    });
    const snap = await get(ref(db, 'seasons'));
    const seasons = snap.val();
    if (!seasons) {
        document.getElementById('season-section').classList.add('hidden');
        return;
    }
    Object.values(seasons).forEach(season => {
        const id = season.id;
        const rewards = season.rewards;
        const finalTitleId = `s${id}_ttl_fin`;
        ALL_SHOP_ITEMS[finalTitleId] = { id: finalTitleId, name: `(СЕЗОН) ${rewards.final_title}`, value: rewards.final_title, price: 0, isSeasonal: true };
        if (rewards.lootbox && rewards.lootbox.titles) {
            rewards.lootbox.titles.forEach((t, i) => {
                const itemId = `s${id}_ttl_loot${i+1}`;
                ALL_SHOP_ITEMS[itemId] = { id: itemId, name: `(СЕЗОН) Титул: ${t}`, value: t, price: 0, isSeasonal: true };
            });
        }
        if (rewards.lootbox && rewards.lootbox.avatars) {
            rewards.lootbox.avatars.forEach((a, i) => {
                 const itemId = `s${id}_av_loot${i+1}`;
                 ALL_SHOP_ITEMS[itemId] = { id: itemId, name: `(СЕЗОН) Аватар ${i+1}`, src: a, price: 0, isSeasonal: true };
            });
        }
    });
    const activeSeasonsList = Object.values(seasons).filter(s => s.isActive);
    activeSeasonsList.sort((a, b) => b.id - a.id);
    activeSeason = activeSeasonsList[0] || null;
    if (!activeSeason) {
        document.getElementById('season-section').classList.add('hidden');
        return; 
    }
    const currentSeasonIdEl = document.getElementById('current-season-id');
    if (currentSeasonIdEl) {
        currentSeasonIdEl.textContent = `Текущий ID: #${activeSeason.id} (${activeSeason.name})`;
    }
    document.getElementById('season-section').classList.remove('hidden');
    document.getElementById('season-title').textContent = `Сезон: ${activeSeason.name}`;
    const updateTimer = () => {
        const now = Date.now();
        const start = activeSeason.dates.start;
        const end = activeSeason.dates.end;
        const timerEl = document.getElementById('season-timer');
        if (now < start) {
            const remaining = start - now;
            const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timerEl.textContent = `⏳ До старта: ${days}д ${hours}ч`;
            timerEl.style.color = '#ffd700'; 
        } 
        else if (now >= start && now < end) {
            const remaining = end - now;
            const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timerEl.textContent = `🔥 Осталось: ${days}д ${hours}ч`;
            timerEl.style.color = '#fff'; 
        } 
        else {
            timerEl.textContent = '🏁 Сезон завершён!';
            timerEl.style.color = '#ff4d4d'; 
        }
    };
    updateTimer();
    setInterval(updateTimer, 60000);
    await calculateSeasonProgress();
};
const TARGET_AMOUNT = 10000;
const singularitySection = document.getElementById('singularity-section');
const singularityBar = document.getElementById('singularity-bar');
const singularityCounter = document.getElementById('singularity-counter');
const donateControls = document.getElementById('donate-controls');
const adminEventControls = document.getElementById('admin-event-controls');
const btnActivateEvent = document.getElementById('btn-activate-event');
const btnExecuteWipe = document.getElementById('btn-execute-wipe');
const eventCompletedMsg = document.getElementById('event-completed-msg');
let isEventActive = false;
let currentEventAmount = 0;
const initSingularity = () => {
    onValue(ref(db, 'world_event'), (snapshot) => {
        const data = snapshot.val() || {};
        isEventActive = data.isActive || false;
        currentEventAmount = data.currentAmount || 0;
        renderSingularityUI();
    });
    if (btnActivateEvent) {
        btnActivateEvent.addEventListener('click', async () => {
            if (!confirm('Активировать сбор средств? Это увидят все.')) return;
            const adminUid = auth.currentUser.uid;
            const updates = {};
            updates['world_event/isActive'] = true;
            updates['world_event/currentAmount'] = 0; 
            updates[`users/${adminUid}/inventory`] = [...(await getUserInventory(adminUid)), 'frame_event_horizon'];
            updates[`users/${adminUid}/equipped/border`] = 'frame_event_horizon';
            await update(ref(db), updates);
            showNotification('Ивент активирован! Рамка выдана Главреду.');
        });
    }
    document.getElementById('btn-donate-matter').addEventListener('click', handleDonate);
    if (btnExecuteWipe) {
        btnExecuteWipe.addEventListener('click', executeSingularityWipe);
    }
const btnResetEvent = document.getElementById('btn-reset-event');
if (btnResetEvent) {
    btnResetEvent.addEventListener('click', async () => {
        if (!confirm("СБРОСИТЬ ИВЕНТ?\n\n1. Шкала станет 0.\n2. Ивент выключится.\n3. Деньги пользователям НЕ вернутся (они останутся потраченными).\n\nВы уверены?")) return;
        showLoader();
        try {
            await update(ref(db), {
                'world_event/currentAmount': 0, 
                'world_event/isActive': false   
            });
            showNotification("Ивент сброшен и остановлен.");
        } catch (e) {
            console.error(e);
            showNotification("Ошибка сброса", 'error');
        } finally {
            hideLoader();
        }
    });
}
};
const getUserInventory = async (uid) => {
    const s = await get(ref(db, `users/${uid}/inventory`));
    return s.val() || [];
};
const renderSingularityUI = () => {
    if (userRole !== 'admin') {
        if (!isEventActive) {
            singularitySection.classList.add('hidden');
            return;
        } else {
            singularitySection.classList.remove('hidden');
        }
    }
    const percent = Math.min(100, (currentEventAmount / TARGET_AMOUNT) * 100);
    singularityBar.style.width = `${percent}%`;
    singularityCounter.textContent = `${currentEventAmount} / ${TARGET_AMOUNT} 🪙`;
    if (userRole === 'admin') {
        if (adminEventControls) adminEventControls.classList.remove('hidden');
        if (isEventActive) {
            btnActivateEvent.classList.add('hidden');
        } else {
            btnActivateEvent.classList.remove('hidden');
        }
        if (currentEventAmount >= TARGET_AMOUNT) {
            btnExecuteWipe.classList.remove('hidden');
        } else {
            btnExecuteWipe.classList.add('hidden');
        }
    } else {
        if (adminEventControls) adminEventControls.classList.add('hidden');
    }
    if (isEventActive) {
        if (currentEventAmount >= TARGET_AMOUNT) {
            donateControls.classList.add('hidden');
            eventCompletedMsg.classList.remove('hidden');
        } else {
            donateControls.classList.remove('hidden');
            eventCompletedMsg.classList.add('hidden');
        }
    } else {
        donateControls.classList.add('hidden');
    }
};
const handleDonate = async () => {
    const input = document.getElementById('donate-amount');
    const amount = parseInt(input.value);
    if (!amount || amount <= 0) return showNotification('Введите число > 0', 'error');
    const uid = auth.currentUser.uid;
    const userSnap = await get(ref(db, `users/${uid}/stats`));
    const stats = userSnap.val() || {};
    const balance = stats.balance || 0;
    if (amount > balance) return showNotification('Недостаточно средств!', 'error');
    const needed = TARGET_AMOUNT - currentEventAmount;
    if (amount > needed) {
        return showNotification(`Нельзя задонатить больше, чем осталось! (Нужно: ${needed})`, 'error');
    }
    const eventRef = ref(db, 'world_event/currentAmount');
    try {
        await runTransaction(eventRef, (currentVal) => {
            const val = currentVal || 0;
            if (val + amount > TARGET_AMOUNT) {
                throw new Error("OVERFLOW"); 
            }
            return val + amount;
        });
        const updates = {};
        const newBalance = balance - amount;
        const currentXP = stats.xp || 0;
        updates[`users/${uid}/stats/balance`] = newBalance;
        updates[`users/${uid}/stats/signature`] = (currentXP * 7) + (newBalance * 3) + 2121;
        await update(ref(db), updates);
        showNotification(`Внесено ${amount} материи!`);
        input.value = '';
    } catch (e) {
        if (e.message === "OVERFLOW") {
            showNotification("Кто-то уже задонатил! Осталось меньше места.", 'error');
        } else {
            console.error(e);
            showNotification("Ошибка транзакции", 'error');
        }
    }
};
const executeSingularityWipe = async () => {
    if (!confirm("ЗАПУСТИТЬ ФИНАЛ?\n\n1. Всем пользователям будет выдана рамка «Событие Горизонта».\n2. Рамка наденется автоматически.\n3. Баланс пользователей НЕ пострадает.\n\nПродолжить?")) return;
    showLoader();
    try {
        const usersSnap = await get(ref(db, 'users'));
        const users = usersSnap.val();
        if (!users) throw new Error("Нет пользователей");
        const updates = {};
        const adminUid = auth.currentUser.uid;
        let count = 0;
        Object.entries(users).forEach(([uid, data]) => {
            if (uid === adminUid) return; 
            const inventory = data.inventory || [];
            if (!inventory.includes('frame_event_horizon')) {
                const newInv = [...inventory, 'frame_event_horizon'];
                updates[`users/${uid}/inventory`] = newInv;
            }
            updates[`users/${uid}/equipped/border`] = 'frame_event_horizon';
            count++;
        });
        await update(ref(db), updates);
        showNotification(`УСПЕХ! Рамки выданы ${count} пользователям.`);
        document.body.classList.add('party-mode');
    } catch (e) {
        console.error("ОШИБКА:", e);
        showNotification("ОШИБКА: " + e.message, 'error');
    } finally {
        hideLoader();
    }
};
const calculateSeasonProgress = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !activeSeason) return;
    userSeasonData = {}; 
    seasonArticlesCount = 0;
    const articlesSnap = await get(query(articlesRef, orderByChild('authorId'), equalTo(currentUser.uid)));
    const articles = articlesSnap.val();
    if (articles) {
        Object.values(articles).forEach(art => {
            if (art.isPublished && art.publishAt >= activeSeason.dates.start && art.publishAt <= activeSeason.dates.end) {
                seasonArticlesCount++;
            }
        });
    }
    const userSeasonSnap = await get(ref(db, `users/${currentUser.uid}/season_data/season_${activeSeason.id}`));
    userSeasonData = userSeasonSnap.val() || {};
    updateBattlePassUI();
};
const updateBattlePassUI = () => {
    const progressFill = document.getElementById('season-progress-fill');
    const statusText = document.getElementById('season-status-text');
    const percent = Math.min(100, (seasonArticlesCount / 6) * 100);
    progressFill.style.width = `${percent}%`;
    statusText.textContent = `У вас ${seasonArticlesCount} одобренных статей в этом сезоне.`;
    const resetNode = (btnId) => {
        const btn = document.getElementById(btnId);
        const node = btn.parentElement;
        node.className = 'bp-reward-node'; 
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        return { node, btn: newBtn };
    };
    const { node: node1, btn: btn1 } = resetNode('lootbox1-btn');
    if (userSeasonData.lootbox1Claimed) {
        node1.classList.add('claimed');
        btn1.onclick = null;
    } else if (seasonArticlesCount >= 2) {
        node1.classList.add('ready');
        btn1.onclick = () => openLootbox(1);
    } else {
        node1.classList.add('locked');
        btn1.onclick = () => showNotification("Нужно 2 статьи!", "info");
    }
    const { node: node2, btn: btn2 } = resetNode('lootbox2-btn');
    if (userSeasonData.lootbox2Claimed) {
        node2.classList.add('claimed');
        btn2.onclick = null;
    } else if (seasonArticlesCount >= 4) {
        node2.classList.add('ready');
        btn2.onclick = () => openLootbox(2);
    } else {
        node2.classList.add('locked');
        btn2.onclick = () => showNotification("Нужно 4 статьи!", "info");
    }
    const { node: node3, btn: btn3 } = resetNode('final-reward-btn');
    if (userSeasonData.finalClaimed) {
        node3.classList.add('claimed');
        btn3.onclick = null;
    } else if (seasonArticlesCount >= 6) {
        node3.classList.add('ready');
        btn3.onclick = claimFinalReward;
    } else {
        node3.classList.add('locked');
        btn3.onclick = () => showNotification("Нужно 6 статей!", "info");
    }
};
const openLootbox = async (boxNumber) => {
    const modal = document.getElementById('lootbox-modal');
    const anim = document.getElementById('lootbox-anim');
    const resultText = document.getElementById('lootbox-result');
    const closeBtn = document.getElementById('lootbox-close-btn');
    const titleEl = document.getElementById('lootbox-title');
    modal.classList.remove('hidden');
    anim.classList.remove('open');
    resultText.classList.add('hidden');
    closeBtn.classList.add('hidden');
    titleEl.textContent = `Открываем Бокс #${boxNumber}...`;
    setTimeout(async () => {
        anim.classList.add('open');
        const rewardsConfig = activeSeason.rewards.lootbox;
        let pool = [];
        rewardsConfig.avatars.forEach(src => {
            const item = Object.values(ALL_SHOP_ITEMS).find(i => i.src === src);
            if (item) pool.push({ type: 'avatar', ...item });
        });
        rewardsConfig.titles.forEach(val => {
            const item = Object.values(ALL_SHOP_ITEMS).find(i => i.value === val);
            if (item) pool.push({ type: 'title', ...item });
        });
        if (boxNumber === 2 && userSeasonData.lootbox1RewardId) {
            console.log("Убираем из пула награду первого бокса:", userSeasonData.lootbox1RewardId);
            pool = pool.filter(item => item.id !== userSeasonData.lootbox1RewardId);
        }
        if (pool.length === 0) {
            resultText.textContent = "Пусто... (Всё уже собрано)";
        } else {
            const winner = pool[Math.floor(Math.random() * pool.length)];
            const uid = auth.currentUser.uid;
            const updates = {};
            updates[`users/${uid}/season_data/season_${activeSeason.id}/lootbox${boxNumber}Claimed`] = true;
            updates[`users/${uid}/season_data/season_${activeSeason.id}/lootbox${boxNumber}RewardId`] = winner.id;
            const invSnap = await get(ref(db, `users/${uid}/inventory`));
            let inv = invSnap.val() || [];
            if (!inv.includes(winner.id)) {
                inv.push(winner.id);
            }
            updates[`users/${uid}/inventory`] = inv;
            await update(ref(db), updates);
            titleEl.textContent = "Награда получена!";
            resultText.textContent = winner.name;
            resultText.classList.remove('hidden');
            if (boxNumber === 1) userSeasonData.lootbox1Claimed = true;
            if (boxNumber === 2) userSeasonData.lootbox2Claimed = true;
            updateBattlePassUI();
        }
        closeBtn.classList.remove('hidden');
    }, 2000);
    closeBtn.onclick = () => {
        modal.classList.add('hidden');
        location.reload(); 
    };
};
const claimFinalReward = async () => {
    if (!confirm(`Забрать титул "${activeSeason.rewards.final_title}"?`)) return;
    const finalTitleValue = activeSeason.rewards.final_title;
    const finalTitleItem = Object.values(ALL_SHOP_ITEMS).find(i => i.value === finalTitleValue);
    if (!finalTitleItem) {
        showNotification('Ошибка: ID титула не найден. Обратитесь к админу.', 'error');
        return;
    }
    const itemIdToGive = finalTitleItem.id; 
    const uid = auth.currentUser.uid;
    const updates = {};
    updates[`users/${uid}/season_data/season_${activeSeason.id}/finalClaimed`] = true;
    const invSnap = await get(ref(db, `users/${uid}/inventory`));
    let inv = invSnap.val() || [];
    if (!inv.includes(itemIdToGive)) {
        inv.push(itemIdToGive); 
    }
    updates[`users/${uid}/inventory`] = inv;
    await update(ref(db), updates);
    showNotification(`Титул получен! Проверьте магазин.`);
    userSeasonData.finalClaimed = true;
    updateBattlePassUI();
    setTimeout(() => location.reload(), 1500);
};
const seasonManagerModal = document.getElementById('season-manager-modal');
if (adminSeasonBtn) {
    adminSeasonBtn.addEventListener('click', async () => {
        showLoader();
        try {
            const snap = await get(ref(db, 'seasons'));
            const seasons = snap.val();
            const active = seasons ? Object.values(seasons).find(s => s.isActive) : null;
            if (active) {
                document.getElementById('edit-season-info').textContent = `Редактируем сезон ID: #${active.id}`;
                document.getElementById('edit-season-id').value = active.id;
                document.getElementById('edit-season-name').value = active.name;
                const startDate = new Date(active.dates.start).toISOString().split('T')[0];
                const endDate = new Date(active.dates.end).toISOString().split('T')[0];
                const editStartPicker = document.getElementById('edit-season-start')._flatpickr;
                const editEndPicker = document.getElementById('edit-season-end')._flatpickr;
                if(editStartPicker) editStartPicker.setDate(startDate);
                if(editEndPicker) editEndPicker.setDate(endDate);
                document.getElementById('edit-season-final-title').value = active.rewards.final_title || '';
                const lootTitles = active.rewards.lootbox && active.rewards.lootbox.titles ? active.rewards.lootbox.titles : ['', ''];
                document.getElementById('edit-loot-title-1').value = lootTitles[0] || '';
                document.getElementById('edit-loot-title-2').value = lootTitles[1] || '';
            } else {
                document.getElementById('edit-season-info').textContent = "Активного сезона нет.";
            }
            seasonManagerModal.classList.remove('hidden');
        } catch (e) {
            console.error(e);
            showNotification('Ошибка загрузки данных сезона', 'error');
        } finally {
            hideLoader();
        }
    });
}
const editSeasonForm = document.getElementById('edit-season-form');
if (editSeasonForm) {
    editSeasonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-season-id').value;
        if (!id) return;
        const name = document.getElementById('edit-season-name').value;
        const startStr = document.getElementById('edit-season-start').value;
        const endStr = document.getElementById('edit-season-end').value;
        const finalTitle = document.getElementById('edit-season-final-title').value;
        const loot1 = document.getElementById('edit-loot-title-1').value;
        const loot2 = document.getElementById('edit-loot-title-2').value;
        const start = new Date(startStr).getTime();
        const end = new Date(endStr).getTime();
        const updates = {};
        updates[`seasons/season_${id}/name`] = name;
        updates[`seasons/season_${id}/dates/start`] = start;
        updates[`seasons/season_${id}/dates/end`] = end;
        updates[`seasons/season_${id}/rewards/final_title`] = finalTitle;
        updates[`seasons/season_${id}/rewards/lootbox/titles/0`] = loot1;
        updates[`seasons/season_${id}/rewards/lootbox/titles/1`] = loot2;
        try {
            await update(ref(db), updates);
            showNotification('Сезон успешно обновлен!');
            seasonManagerModal.classList.add('hidden');
            setTimeout(() => location.reload(), 1000); 
        } catch (error) {
            console.error(error);
            showNotification('Ошибка сохранения', 'error');
        }
    });
}
const toggleNewSeasonBtn = document.getElementById('toggle-new-season-form');
if (toggleNewSeasonBtn) {
    toggleNewSeasonBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        const form = document.getElementById('new-season-form');
        form.classList.toggle('hidden');
        toggleNewSeasonBtn.textContent = form.classList.contains('hidden') 
            ? 'Раскрыть форму создания' 
            : 'Скрыть форму создания';
    });
}
const newSeasonForm = document.getElementById('new-season-form');
if (newSeasonForm) {
    newSeasonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!confirm('ВНИМАНИЕ! Вы запускаете новый сезон. Старый будет завершен. Продолжить?')) return;
        const name = document.getElementById('new-season-name').value;
        const start = new Date(document.getElementById('new-season-start').value).getTime();
        const end = new Date(document.getElementById('new-season-end').value).getTime();
        const finalT = document.getElementById('new-season-final-title').value;
        const loot1 = document.getElementById('new-loot-title-1').value;
        const loot2 = document.getElementById('new-loot-title-2').value;
        showLoader();
        try {
            const snap = await get(ref(db, 'seasons'));
            const seasons = snap.val() || {};
            const allSeasons = Object.values(seasons);
            const maxId = allSeasons.reduce((max, s) => Math.max(max, s.id || 0), 0);
            const newId = maxId + 1;
            const newSeasonKey = `season_${newId}`;
            const updates = {};
            Object.keys(seasons).forEach(k => {
                updates[`seasons/${k}/isActive`] = false;
            });
            updates[`seasons/${newSeasonKey}`] = {
                id: newId,
                name: name,
                isActive: true,
                dates: { start, end },
                rewards: {
                    final_title: finalT,
                    lootbox: {
                        avatars: [`season_${newId}_loot_1.png`, `season_${newId}_loot_2.png`],
                        titles: [loot1, loot2]
                    }
                }
            };
            await update(ref(db), updates);
            alert(`Сезон #${newId} запущен!`);
            location.reload();
        } catch (error) {
            console.error(error);
            showNotification("Ошибка запуска сезона", "error");
        } finally {
            hideLoader();
        }
    });
}
const createArticleCard = (article) => {
    const card = document.createElement('div');
    card.className = 'article-card collapsed';
    card.dataset.id = article.id;
    const createdAt = new Date(article.createdAt).toLocaleString('ru-RU');
    const publishAtDate = article.publishAt ? new Date(article.publishAt) : null;
    const publishAt = article.isPublished && publishAtDate 
        ? `Опубликовать: ${publishAtDate.toLocaleDateString('ru-RU')}` 
        : 'Не опубликовано';
    const publishAtForInput = publishAtDate 
        ? publishAtDate.toISOString().split('T')[0] 
        : '';
    let editorAdminControls = '';
    const isAuthor = auth.currentUser && auth.currentUser.uid === article.authorId;
    if (isAuthor || userRole === 'admin') {
        editorAdminControls = `
            <button class="btn btn-secondary edit-btn">Редактировать</button>
            <button class="btn btn-danger delete-btn">Удалить</button>
        `;
    }
    if (userRole === 'admin') {
        editorAdminControls += `
            <button class="btn btn-secondary user-manage-btn" style="margin-left:5px;" title="Управление автором">👤</button>
        `;
    }
    if (article.useUrgent) {
        card.classList.add('urgent-mode'); 
    }
    let adminSpecificControls = '';
    if (userRole === 'admin') {
        adminSpecificControls = `
            <div class="admin-card-controls">
                <label>Дата публикации: 
                    <input type="text" class="publish-date-input" value="${publishAtForInput}" placeholder="Выберите дату...">
                </label>
                <label class="custom-checkbox-label">
                    <input type="checkbox" class="prevent-deletion-checkbox" ${article.preventDeletion ? 'checked' : ''}>
                    <span class="custom-checkbox-visual"></span> Не удалять автоматически
                </label>
            </div>
        `;
    }
    let imagesListHtml = '';
    let photos = [];
    if (article.images && Array.isArray(article.images)) {
        photos = article.images;
    } else if (article.image) {
        photos = [article.image];
    }
    if (photos.length > 0) {
        imagesListHtml = `<div class="article-images-list">`;
        photos.forEach((url, index) => {
            const safeUrl = url.replace(/["'<>]/g, '');
            if (safeUrl.toLowerCase().trim().startsWith('javascript:')) return;
            imagesListHtml += `
                <a href="${escapeHTML(safeUrl)}" target="_blank" class="article-image-link" title="Открыть фото">
                    📷 Фото ${index + 1}
                </a>
            `;
        });
        imagesListHtml += `</div>`;
    }
    card.innerHTML = `
        ${imagesListHtml} <!-- Ссылки вверху -->
        <h3>${escapeHTML(article.title)}</h3>
        <p class="article-text">${escapeHTML(article.text)}</p>
        <div class="article-meta">
            <span>Автор: ${escapeHTML(article.authorName)}, ${escapeHTML(article.authorClass)}</span>
            <span>Подано: ${createdAt}</span>
            <span>Статус: ${publishAt}</span>
        </div>
        <div class="card-controls">
            ${editorAdminControls}
            <button class="btn btn-toggle">Развернуть</button>
        </div>
        ${adminSpecificControls}
    `;
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) editBtn.addEventListener('click', () => handleEdit(article));
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) deleteBtn.addEventListener('click', () => handleDelete(article.id));
    const userManageBtn = card.querySelector('.user-manage-btn');
    if (userManageBtn) {
        userManageBtn.addEventListener('click', () => openUserManager(article.authorId, article.authorName));
    }
    const toggleBtn = card.querySelector('.btn-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => { 
        card.classList.toggle('collapsed'); 
        toggleBtn.textContent = card.classList.contains('collapsed') ? 'Развернуть' : 'Свернуть'; 
    });
    if (userRole === 'admin') {
        const dateInput = card.querySelector('.publish-date-input');
        flatpickr(dateInput, { dateFormat: "Y-m-d", allowInput: false, locale: "ru" });
        dateInput.addEventListener('change', (e) => handlePublishDateChange(article.id, e.target.value, card));
        card.querySelector('.prevent-deletion-checkbox').addEventListener('change', (e) => handlePreventDeletionChange(article.id, e.target.checked));
    }
    return card;
};
const toggleAchBtn = document.getElementById('toggle-achievements-btn');
const achGrid = document.getElementById('achievements-grid');
if (toggleAchBtn && achGrid) {
    toggleAchBtn.addEventListener('click', () => {
        achGrid.classList.toggle('collapsed-on-mobile');
        toggleAchBtn.textContent = achGrid.classList.contains('collapsed-on-mobile') ? 'Развернуть' : 'Свернуть';
    });
}

const incubatorSection = document.getElementById('incubator-section');
const ideasList = document.getElementById('ideas-list');
const toggleIncubatorBtn = document.getElementById('toggle-incubator');
const editorIdeaInput = document.getElementById('editor-idea-input');
const editorSubmitIdeaBtn = document.getElementById('editor-submit-idea');
const fetchIdeas = () => {
    onValue(ref(db, 'ideas'), (snapshot) => {
        ideasList.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            incubatorSection.classList.remove('hidden');
            Object.entries(data).reverse().forEach(([id, idea]) => {
                const div = document.createElement('div');
                div.className = 'idea-item';
                const date = idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : '';
                let deleteButtonHtml = '';
                if (userRole === 'admin') {
                    deleteButtonHtml = `<button class="btn-delete-idea" title="Удалить">✕</button>`;
                }
                div.innerHTML = `
                    ${deleteButtonHtml}
                    <p>${escapeHTML(idea.text)}</p>
                    <div class="idea-meta">От: ${escapeHTML(idea.author) || 'Аноним'} • ${date}</div>
                `;
                if (userRole === 'admin') {
                    const delBtn = div.querySelector('.btn-delete-idea');
                    if (delBtn) {
                        delBtn.addEventListener('click', async () => {
                            if(confirm('Удалить эту идею?')) {
                                await remove(ref(db, `ideas/${id}`));
                            }
                        });
                    }
                }
                ideasList.appendChild(div);
            });
        } else {
            ideasList.innerHTML = '<p style="color:gray; font-size:0.9rem; text-align:center;">Идей пока нет. Будь первым!</p>';
        }
    });
};
editorSubmitIdeaBtn.addEventListener('click', async () => {
    const text = editorIdeaInput.value.trim();
    if (!text) {
        return; 
    }
    if (text.toLowerCase() === 'каникулы' || text.toLowerCase() === 'домой') {
        showNotification('Не сыпь соль на рану... 😭', 'info');
        editorIdeaInput.value = '';
        return;
    }
    let authorName = "Редактор";
    if (currentUserProfile) {
        authorName = `${currentUserProfile.firstName} ${currentUserProfile.lastName}`;
    }
    await push(ref(db, 'ideas'), {
        text: text, 
        author: authorName,
        createdAt: serverTimestamp()
    });
    editorIdeaInput.value = '';
    showNotification('Идея добавлена!');
});
toggleIncubatorBtn.addEventListener('click', () => {
    ideasList.classList.toggle('hidden');
});
const fetchArticles = () => new Promise(async (resolve) => {
    const currentUser = auth.currentUser;
    const container = document.getElementById('articles-container');
    const loadMoreContainer = document.getElementById('load-more-container');
    if (currentLimit === 10) container.innerHTML = ''; 
    if (!currentUser) { resolve(); return; }
    let queryRef;
    if (userRole === 'admin' || userRole === 'manager') {
        queryRef = query(articlesRef, limitToLast(currentLimit));
    } else {
        queryRef = query(articlesRef, orderByChild('authorId'), equalTo(currentUser.uid), limitToLast(currentLimit));
    }
    try {
        const snapshot = await get(queryRef);
        const data = snapshot.val();
        let articlesList = [];
        if (data) {
            articlesList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            if (userRole !== 'admin' && userRole !== 'manager') {
                const apprenticesSnap = await get(ref(db, `users/${currentUser.uid}/mentorship/apprentices`));
                if (apprenticesSnap.exists()) {
                    const appIds = Object.keys(apprenticesSnap.val());
                    for (const appId of appIds) {
                        const appArtsSnap = await get(query(articlesRef, orderByChild('authorId'), equalTo(appId), limitToLast(10)));
                        if (appArtsSnap.exists()) {
                            const appArts = Object.entries(appArtsSnap.val()).map(([id, val]) => ({ id, ...val }));
                            articlesList = [...articlesList, ...appArts];
                        }
                    }
                }
            }
        }
        if (articlesList.length < currentLimit) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
        }
        articlesList.sort((a, b) => {
            if (currentSortMode === 'publication') {
                const aPub = a.publishAt;
                const bPub = b.publishAt;
                if (!aPub && bPub) return -1;
                if (aPub && !bPub) return 1;
                if (!aPub && !bPub) return b.createdAt - a.createdAt;
                return bPub - aPub;
            } else {
                return b.createdAt - a.createdAt;
            }
        });
        calculateAndRenderStats(articlesList);
        container.innerHTML = ''; 
        articlesList.forEach((article, index) => {
            const card = createArticleCard(article);
            if (auth.currentUser && article.authorId !== auth.currentUser.uid && userRole !== 'admin') {
                card.style.borderLeft = "4px solid var(--accent-color)";
            }
            container.appendChild(card);
            setTimeout(() => card.classList.add('fade-in'), index * 30);
        });
    } catch (e) {
        console.error(e);
    }
    resolve();
});
const processArticlesSnapshot = (articlesData) => {
    articlesContainer.innerHTML = '';
    if (articlesData) {
        const articles = Object.entries(articlesData).map(([id, data]) => ({ id, ...data }));
        articles.sort((a, b) => {
            if (currentSortMode === 'publication') {
                const aHasDate = !!a.publishAt;
                const bHasDate = !!b.publishAt;
                if (aHasDate !== bHasDate) return aHasDate ? 1 : -1;
                if (aHasDate && bHasDate) return b.publishAt - a.publishAt; 
                return b.createdAt - a.createdAt;
            } else {
                return b.createdAt - a.createdAt;
            }
        });
        calculateAndRenderStats(articles); 
        articles.forEach((article, index) => {
            const card = createArticleCard(article);
            if (auth.currentUser && article.authorId !== auth.currentUser.uid && userRole !== 'admin') {
                card.style.borderLeft = "4px solid var(--accent-color)";
                const badge = document.createElement('div');
                badge.textContent = "Статья ученика";
                badge.style.cssText = "font-size: 0.75rem; background: rgba(0,198,255,0.1); color: var(--accent-hover-color); display:inline-block; padding: 2px 6px; border-radius: 4px; margin-bottom: 5px;";
                card.prepend(badge);
            }
            articlesContainer.appendChild(card);
            setTimeout(() => card.classList.add('fade-in'), index * 50);
        });
    } else {
        calculateAndRenderStats([]);
    }
};
const renderUIForRole = async () => {
    mainContent.classList.remove('hidden');
    formWrapper.className = '';
    articleFormSection.classList.add('hidden');
    createArticleBtn.classList.remove('hidden');
    if (fabCreateBtn) fabCreateBtn.classList.remove('hidden');
    adminControls.classList.add('hidden');
    const adminSeasonBtn = document.getElementById('admin-season-btn');
    switch (userRole) {
        case 'admin':
            mainHeader.textContent = 'Панель Главреда';
            articlesListHeader.textContent = 'Все статьи на рассмотрении';
            adminControls.classList.remove('hidden');
            createArticleBtn.textContent = '+ Написать статью';
            adminSeasonBtn.classList.remove('hidden');
            break;
        case 'manager':
            mainHeader.textContent = 'Панель Менеджера'; 
            adminSeasonBtn.classList.add('hidden');
            break;
        default: 
            mainHeader.textContent = 'Панель Редактора'; 
            adminSeasonBtn.classList.add('hidden');
            break;
    }
    const loadMoreBtn = document.getElementById('load-more-btn');
    const newBtn = loadMoreBtn.cloneNode(true);
    loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
    newBtn.addEventListener('click', async () => {
        currentLimit += 10; 
        newBtn.textContent = 'Загрузка...';
        await fetchArticles();
        newBtn.textContent = '↓ Загрузить ещё';
    });
    fetchIdeas();
    initSeasons();
    initMentorshipUI();
    initSingularity();
    recalculateMentorStats();
    await fetchArticles();
    initSidebar();
};
const setSortMode = async (mode) => {
    currentSortMode = mode;
    localStorage.setItem(SORT_MODE_KEY, mode);
    sortBySubmissionBtn.classList.toggle('active', mode === 'submission');
    sortByPublicationBtn.classList.toggle('active', mode === 'publication');
    showLoader();
    await fetchArticles();
    hideLoader();
};
const userManagerModal = document.getElementById('user-manager-modal');
const manageUserName = document.getElementById('manage-user-name');
const manageUserId = document.getElementById('manage-user-id');
const manageRankSelect = document.getElementById('manage-rank-select');
const manageAchievementsList = document.getElementById('manage-achievements-list');
const saveUserStatsBtn = document.getElementById('save-user-stats-btn');
const closeUserManagerBtn = document.getElementById('close-user-manager-btn');
const openUserManager = async (authorId, authorName) => {
    if (userRole !== 'admin') return;
    showLoader();
    try {
        const snapshot = await get(ref(db, `userStats/${authorId}`));
        const overrides = snapshot.exists() ? snapshot.val() : {};
        manageUserName.textContent = authorName;
        manageUserId.value = authorId;
        manageRankSelect.value = overrides.rank || ""; 
        manageAchievementsList.innerHTML = '';
        const forced = overrides.achievements || {};
        ACHIEVEMENTS_CONFIG.forEach(ach => {
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            const isChecked = forced[ach.id] === true ? 'checked' : '';
            label.innerHTML = `
                <input type="checkbox" value="${ach.id}" ${isChecked}>
                <span>${ach.icon} ${ach.title}</span>
            `;
            manageAchievementsList.appendChild(label);
        });

        // Инвентарь
        const invSnap = await get(ref(db, `users/${authorId}/inventory`));
        const userStatsSnap = await get(ref(db, `userStats/${authorId}/inventory`));
        const userInv = invSnap.val() ||[];
        const adminInv = userStatsSnap.val() ||[];
        const eff = new Set(userInv);
        adminInv.forEach(id => eff.has(id) ? eff.delete(id) : eff.add(id));
        const combinedInv = Array.from(eff);

        const invList = document.getElementById('manage-inventory-list');
        invList.innerHTML = '';
        
        // Формируем правильный порядок предметов как в магазине
        const orderedItems =[
            ...SHOP_ITEMS_BASE.avatars,
            ...SHOP_ITEMS_BASE.titles,
            ...SHOP_ITEMS_BASE.borders,
            ...SHOP_ITEMS_BASE.auras
        ];
        
        // Добавляем сезонные предметы, которых нет в базовом списке
        Object.values(ALL_SHOP_ITEMS).forEach(item => {
            if (item.isSeasonal && !orderedItems.find(i => i.id === item.id)) {
                orderedItems.push(item);
            }
        });

        const isRaw = localStorage.getItem('pref_raw_cosmetics') === 'true';
        if (isRaw) {
            invList.className = 'checkbox-list';
            orderedItems.forEach(item => {
                const isChecked = combinedInv.includes(item.id) ? 'checked' : '';
                invList.innerHTML += `
                    <label class="checkbox-item">
                        <input type="checkbox" value="${item.id}" ${isChecked} class="admin-inv-cb">
                        <span><strong style="color:var(--accent-color)">${item.id}</strong> - ${item.name}</span>
                    </label>
                `;
            });
        } else {
            invList.className = 'admin-visual-inv-grid';
            let html = '';
            orderedItems.forEach(item => {
                const isChecked = combinedInv.includes(item.id) ? 'checked' : '';
                let visual = '';
                
                if (item.src) {
                    visual = `<img src="${escapeHTML(item.src)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`;
                } else if (item.value) {
                    let specialClass = '';
                    if (item.value === 'Повелитель Света') specialClass = 'special-light';
                    else if (item.value === 'Владыка Тьмы') specialClass = 'special-dark';
                    visual = `<span class="rank-tag title-tag ${specialClass}" style="font-size:0.5rem; padding:2px; max-width:100%; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${escapeHTML(item.name.replace('Титул: ','').replace('(СЕЗОН) ',''))}</span>`;
                } else if (item.class && (item.class.startsWith('border') || item.class.startsWith('frame'))) {
                    let pClass = item.class;
                    if (pClass === 'border-hydro') pClass += ' hydro-liquid';
                    if (pClass === 'border-perimeter') pClass += ' perimeter-tier-6';
                    visual = `<div class="${pClass}" style="width:40px;height:40px;border-radius:50%;background:#222;"></div>`;
                } else if (item.class && item.class.startsWith('aura')) {
                    visual = `<div style="width:40px;height:40px;border-radius:50%;background:#222;position:relative;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:200%;height:200%;background:url('${item.id}.png') center/contain no-repeat;animation:aura-global-spin 10s linear infinite;"></div></div>`;
                } else {
                    visual = `<span style="font-size:1.5rem;">🎁</span>`;
                }

                html += `
                    <label class="admin-visual-inv-item ${isChecked ? 'selected' : ''}" title="${item.name}">
                        <input type="checkbox" value="${item.id}" ${isChecked} class="admin-inv-cb">
                        ${visual}
                    </label>
                `;
            });
            invList.innerHTML = html;
            
            invList.querySelectorAll('.admin-inv-cb').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    if (e.target.checked) e.target.parentElement.classList.add('selected');
                    else e.target.parentElement.classList.remove('selected');
                });
            });
        }

        userManagerModal.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        showNotification('Ошибка загрузки данных пользователя', 'error');
    } finally {
        hideLoader();
    }
};
saveUserStatsBtn.addEventListener('click', async () => {
    const uid = manageUserId.value;
    const newRank = manageRankSelect.value;
    const achievementsObj = {};
    const checkboxes = manageAchievementsList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (cb.checked) achievementsObj[cb.value] = true;
    });
    const invCheckboxes = document.querySelectorAll('.admin-inv-cb');
    const newInv =[];
    invCheckboxes.forEach(cb => {
        if (cb.checked) newInv.push(cb.value);
    });
    
    showLoader();
    try {
        const userSnap = await get(ref(db, `users/${uid}/inventory`));
        const currentUserInv = userSnap.val() ||[];
        
        // Сравниваем купленный инвентарь с тем, что отметил админ, 
        // и получаем список переключателей (XOR)
        const adminSet = new Set(currentUserInv);
        newInv.forEach(id => adminSet.has(id) ? adminSet.delete(id) : adminSet.add(id));
        const nextAdminInv = Array.from(adminSet);

        const dataToSave = {
            rank: newRank || null, 
            achievements: achievementsObj,
            inventory: nextAdminInv.length > 0 ? nextAdminInv : null
        };
        
        const updates = {};
        updates[`userStats/${uid}`] = dataToSave;
        // Мы больше ВООБЩЕ не трогаем папку users/${uid}/inventory, 
        // она остаётся чистой историей покупок пользователя!
        
        await update(ref(db), updates);
        showNotification('Данные пользователя обновлены!');
        userManagerModal.classList.add('hidden');
        if (uid === auth.currentUser.uid) {
             await fetchArticles(); 
        }
    } catch (e) {
        console.error(e);
        showNotification('Ошибка сохранения', 'error');
    } finally {
        hideLoader();
    }
});
closeUserManagerBtn.addEventListener('click', () => {
    userManagerModal.classList.add('hidden');
});
const VIBE_PHRASES = [
    "Как настроение, коллега?",
    "Готов(а) творить историю?",
    "Кофе выпит, глаза открыты?",
    "Какой сегодня муд?",
    "Оцените уровень своего дзена:"
];
const checkAndShowVibeModal = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const todayKey = new Date().toISOString().split('T')[0]; 
    const userVibeRef = ref(db, `dailyVibe/${currentUser.uid}`);
    try {
        const snapshot = await get(userVibeRef);
        const data = snapshot.val();
        if (!data || data.date !== todayKey) {
            const modal = document.getElementById('vibe-check-modal');
            const questionEl = document.getElementById('vibe-question');
            questionEl.textContent = VIBE_PHRASES[Math.floor(Math.random() * VIBE_PHRASES.length)];
            modal.classList.remove('hidden');
            const buttons = modal.querySelectorAll('.emoji-btn');
            buttons.forEach(btn => {
                btn.onclick = async () => {
                    const val = parseInt(btn.dataset.value);
                    await set(userVibeRef, { date: todayKey, val: val });
                    showNotification('Вайб записан! ✨');
                    modal.classList.add('hidden');
                };
            });
        }
    } catch (e) {
        console.error("Ошибка вайб-чека:", e);
    }
};
const checkUserProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
        const userRef = ref(db, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        if (!userData) {
            await update(userRef, {
                email: currentUser.email,
                stats: { 
                    xp: 0, 
                    balance: 0,
                    totalCoinsEarned: 0,
                    spentCoins: 0
                }
            });
            document.getElementById('missing-info-modal').classList.remove('hidden');
            return;
        }
        if (!userData.email) {
            await update(userRef, { email: currentUser.email });
            userData.email = currentUser.email; 
        }
        if (!userData.stats) {
             await update(ref(db, `users/${currentUser.uid}/stats`), {
                xp: 0, 
                balance: 0,
                signature: 2121
             });
        }
        if (userData.firstName && userData.userClass) {
            currentUserProfile = userData;
            const nameEl = document.getElementById('stats-username');
            if (nameEl) {
                nameEl.textContent = `${userData.lastName} ${userData.firstName}`;
            }
            checkAndShowVibeModal(); 
        } else {
            document.getElementById('missing-info-modal').classList.remove('hidden');
        }
    } catch (e) {
        console.error("❌ Глобальная ошибка checkUserProfile:", e);
        if (e.message.includes("PERMISSION_DENIED")) {
            showNotification("Ошибка доступа к профилю. Попробуйте перезайти.", "error");
        }
    }
};
const missingInfoForm = document.getElementById('missing-info-form');
if (missingInfoForm) {
    missingInfoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const name = document.getElementById('missing-name').value.trim();
        const surname = document.getElementById('missing-surname').value.trim();
        const userClass = document.getElementById('missing-class').value.trim();
        if (name && surname && userClass) {
            showLoader();
            try {
                await update(ref(db, `users/${currentUser.uid}`), {
                    firstName: name,
                    lastName: surname,
                    userClass: userClass
                });
                currentUserProfile = { firstName: name, lastName: surname, userClass: userClass };
                document.getElementById('missing-info-modal').classList.add('hidden');
                showNotification('Профиль сохранен!');
                checkAndShowVibeModal();
            } catch (error) {
                showNotification('Ошибка сохранения.', 'error');
            } finally {
                hideLoader();
            }
        }
    });
}
const initMentorshipUI = async () => {
    const uid = auth.currentUser.uid;
    const section = document.getElementById('mentorship-section');
    const mentorPanel = document.getElementById('mentorship-mentor-panel');
    const studentInfo = document.getElementById('mentorship-student-info');
    const inviteBlock = document.getElementById('mentorship-invite-block');
    const statsSnap = await get(ref(db, `users/${uid}/stats`));
    const xp = statsSnap.val()?.xp || 0;
    const mentorSnap = await get(ref(db, `users/${uid}/mentorship`));
    const mentorshipData = mentorSnap.val() || {};
    section.classList.remove('hidden'); 
    if (xp >= 4000 || userRole === 'admin') {
        mentorPanel.classList.remove('hidden');
        renderApprenticesList(mentorshipData.apprentices || {});
        document.getElementById('invite-apprentice-btn').onclick = async () => {
            const email = document.getElementById('apprentice-email-input').value.trim();
            if (!email) return;
            showLoader();
            try {
                const usersRef = ref(db, 'users');
                const q = query(usersRef, orderByChild('email'), equalTo(email));
                const querySnapshot = await get(q);
                if (!querySnapshot.exists()) {
                    showNotification('Пользователь с таким Email не найден в базе данных.', 'error');
                    hideLoader();
                    return;
                }
                let targetUid = null;
                let targetData = null;
                querySnapshot.forEach((child) => {
                    targetUid = child.key;
                    targetData = child.val();
                });
                if (targetUid === uid) {
                    showNotification('Нельзя стать наставником самому себе.', 'error');
                    hideLoader();
                    return;
                }
                const targetXP = targetData.stats?.xp || 0;
                if (targetXP >= 500) {
                 showNotification('Этот пользователь уже слишком опытный для ученичества!', 'info');
                 hideLoader();
                 return;
            }
                if (targetData.mentorship && targetData.mentorship.status === 'active') {
                    showNotification('У этого пользователя уже есть наставник.', 'error');
                    hideLoader();
                    return;
                }
                const myName = (currentUserProfile?.firstName || 'Наставник') + ' ' + (currentUserProfile?.lastName || '');
                await update(ref(db, `users/${targetUid}/mentorship`), {
                    mentorId: uid,
                    mentorName: myName,
                    status: 'pending'
                });
                showNotification(`Приглашение отправлено пользователю ${email}`);
                document.getElementById('apprentice-email-input').value = '';
            } catch (e) {
                console.error(e);
                showNotification('Ошибка при приглашении', 'error');
            } finally {
                hideLoader();
            }
        };
    } 
    else {
        if (mentorshipData.status === 'pending') {
            inviteBlock.classList.remove('hidden');
            document.getElementById('invite-mentor-name').textContent = mentorshipData.mentorName;
            document.getElementById('accept-mentor-btn').onclick = async () => {
                showLoader();
                try {
                    const studentName = (currentUserProfile?.firstName || 'Ученик') + ' ' + (currentUserProfile?.lastName || '');
                    const studentEmail = auth.currentUser.email;
                    await update(ref(db, `users/${uid}/mentorship`), { status: 'active' });
                    await update(ref(db, `users/${mentorshipData.mentorId}/mentorship/apprentices/${uid}`), { 
                        email: studentEmail,
                        name: studentName
                    });
                    showNotification("Поздравляем! У вас теперь есть наставник.");
                    setTimeout(() => location.reload(), 1000); 
                } catch (e) {
                    console.error("Ошибка принятия наставничества:", e);
                    showNotification('Ошибка: не удалось записаться к наставнику. Попробуйте еще раз.', 'error');
                } finally {
                    hideLoader(); 
                }
            };
        } else if (mentorshipData.status === 'active') {
            studentInfo.classList.remove('hidden');
            document.getElementById('current-mentor-name').textContent = mentorshipData.mentorName;
            document.getElementById('leave-mentor-btn').onclick = async () => {
                if(!confirm('Вы уверены, что хотите уйти от наставника?')) return;
                showLoader();
                const mentorId = mentorshipData.mentorId;
                await remove(ref(db, `users/${uid}/mentorship`));
                await remove(ref(db, `users/${mentorId}/mentorship/apprentices/${uid}`));
                location.reload();
            };
        } else {
             section.innerHTML = `<p style="text-align:center; color:#aaa;">Достигните ранга "Спецкор" (4000 XP), чтобы стать наставником.<br>Или дождитесь приглашения, если вы новичок.</p>`;
        }
    }
};
const renderApprenticesList = (apprentices) => {
    const container = document.getElementById('apprentices-list');
    container.innerHTML = '';
    if (Object.keys(apprentices).length === 0) {
        container.innerHTML = '<div style="color: gray; font-size: 0.9rem;">Учеников пока нет.</div>';
        return;
    }
    Object.entries(apprentices).forEach(([id, data]) => {
        const div = document.createElement('div');
        div.style.cssText = "background: var(--input-bg); padding: 10px; border-radius: 6px; display:flex; justify-content:space-between; align-items:center;";
        div.innerHTML = `
            <span>👤 ${data.name || data.email}</span>
            <button class="btn-link kick-apprentice" data-id="${id}" style="color: var(--danger-color); font-size: 0.8rem;">Исключить</button>
        `;
        div.querySelector('.kick-apprentice').addEventListener('click', async (e) => {
            if(!confirm('Исключить этого ученика?')) return;
            const targetId = e.target.dataset.id;
            await remove(ref(db, `users/${auth.currentUser.uid}/mentorship/apprentices/${targetId}`));
            await remove(ref(db, `users/${targetId}/mentorship`));
            showNotification('Ученик исключен.');
            div.remove();
        });
        container.appendChild(div);
    });
};
document.addEventListener('DOMContentLoaded', () => {
    showLoader();
    logoutBtn.addEventListener('click', handleLogout);
    articleForm.addEventListener('submit', handleFormSubmit);
    cancelEditBtn.addEventListener('click', handleCancelEdit);
    cleanupBtn.addEventListener('click', handleCleanup);
    createArticleBtn.addEventListener('click', handleCreateClick);
    if (fabCreateBtn) {
        fabCreateBtn.addEventListener('click', handleCreateClick);
    }
    textTextarea.addEventListener('input', checkTextareaOverflow);
    toggleTextBtn.addEventListener('click', toggleTextareaSize);
    sortBySubmissionBtn.classList.toggle('active', currentSortMode === 'submission');
    sortByPublicationBtn.classList.toggle('active', currentSortMode === 'publication');
    sortBySubmissionBtn.addEventListener('click', () => setSortMode('submission'));
    sortByPublicationBtn.addEventListener('click', () => setSortMode('publication'));
    addImageInputBtn.addEventListener('click', () => addImageInput());
    const flatpickrConfig = {
        dateFormat: "Y-m-d", 
        locale: "ru",        
        theme: "dark",       
        allowInput: false    
    };
    const newStart = document.getElementById('new-season-start');
    const newEnd = document.getElementById('new-season-end');
    if (newStart) flatpickr(newStart, flatpickrConfig);
    if (newEnd) flatpickr(newEnd, flatpickrConfig);
    const editStart = document.getElementById('edit-season-start');
    const editEnd = document.getElementById('edit-season-end');
    if (editStart) flatpickr(editStart, flatpickrConfig);
    if (editEnd) flatpickr(editEnd, flatpickrConfig);
    const recalcBtn = document.getElementById('recalc-user-stats-btn');
    if (recalcBtn) {
        recalcBtn.addEventListener('click', async () => {
            const targetUid = document.getElementById('manage-user-id').value;
            if (!targetUid) return;
            showLoader();
            try {
                const artsSnap = await get(query(articlesRef, orderByChild('authorId'), equalTo(targetUid)));
                const arts = artsSnap.val();
                let xp = 0;
                let coins = 0;
                let calculatedLikes = 0;
                
                if (arts) {
                    Object.values(arts).forEach(a => {
                        calculatedLikes += (a.likeCount || 0);
                        if (a.isPublished) {
                            const rewards = calculateArticleRewards(a.text || '');
                            xp += rewards.xp;
                            coins += rewards.coins;
                        }
                    });
                }
                
                const userSnap = await get(ref(db, `users/${targetUid}`));
                const userData = userSnap.val() || {};
                const currentStats = userData.stats || {};
                
                const currentInv = userData.inventory ? userData.inventory : new Array();
                const totalSpent = getInventoryTotalCost(currentInv);
                const lastXp = currentStats.lastXpGain || 0;
                const newBalance = Math.max(0, coins - totalSpent);
                const signature = (xp * 7) + (newBalance * 3) + 2121;

                const finalData = {
                    xp: xp,
                    balance: newBalance,
                    signature: signature,
                    totalLikes: calculatedLikes,
                    lastXpGain: lastXp,
                    lastUpdated: serverTimestamp(),
                    totalCoinsEarned: coins // Записываем точную сумму заработка для Анти-Чита
                };
                
                await set(ref(db, `users/${targetUid}/stats`), finalData);
                showNotification(`Статистика пересчитана! XP: ${xp}, Баланс: ${newBalance}, Лайки: ${calculatedLikes}`);
                
                if (targetUid === auth.currentUser.uid) {
                    fetchArticles();
                }
                userManagerModal.classList.add('hidden');
            } catch (e) {
                console.error("Ошибка пересчета:", e);
                showNotification('Ошибка: ' + e.message, 'error');
            } finally {
                hideLoader();
            }
        });
    }
    const textInput = document.getElementById('text');
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            const start = textInput.selectionStart;
            const end = textInput.selectionEnd;
            const text = textInput.value;
            const selected = text.substring(start, end);
            let replace = '';
            if (tag === 'b') replace = `**${selected}**`;
            if (tag === 'i') replace = `__${selected}__`;
            if (tag === 'q') replace = `>> ${selected}`;
            if (tag === 'l') replace = `[${selected}](url)`;
            textInput.value = text.substring(0, start) + replace + text.substring(end);
        });
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const ideaInput = document.getElementById('editor-idea-input');
    if (ideaInput) {
        ideaInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const forbidden = ['money', 'coins', 'деньги', 'баланс', 'balance'];
            const adminWords = ['admin', 'root', 'sudo', 'админ'];
            if (forbidden.some(w => val.includes(w))) {
                triggerHackerEffect(e.target, "Мы не Центробанк, работай давай! 💸");
            } else if (adminWords.some(w => val.includes(w))) {
                triggerHackerEffect(e.target, "Хорошая попытка, товарищ майор 👮‍♂️");
            }
        });
    }
    function triggerHackerEffect(element, msg) {
        element.classList.add('shake-error');
        showNotification(msg, 'error');
        element.value = ''; 
        setTimeout(() => element.classList.remove('shake-error'), 500);
    }
    const articleTextarea = document.getElementById('text');
    let idleTimer;
    let placeholderInterval;
    const phrases = [
        "Ну напиши хоть что-нибудь...",
        "Вдохновение вышло из чата? 🗿",
        "Глеб ждёт статью...",
        "Ладно, я сам начну: Жили-были...",
        "Дедлайн близко...",
        "Кот прошел по клавиатуре? 🐈"
    ];
    if (articleTextarea) {
        articleTextarea.addEventListener('focus', () => {
            if (articleTextarea.value.trim() === '') {
                startIdleTimer();
            }
        });
        articleTextarea.addEventListener('input', () => {
            clearTimeout(idleTimer);
            clearInterval(placeholderInterval);
            articleTextarea.setAttribute('placeholder', ''); 
        });
        articleTextarea.addEventListener('blur', () => {
            clearTimeout(idleTimer);
            clearInterval(placeholderInterval);
        });
        function startIdleTimer() {
            idleTimer = setTimeout(() => {
                let i = 0;
                placeholderInterval = setInterval(() => {
                    articleTextarea.setAttribute('placeholder', phrases[i % phrases.length]);
                    i++;
                }, 2000); 
            }, 10000);
        }
    }
});
const statsReportBtn = document.getElementById('stats-report-btn');
const statsModal = document.getElementById('stats-modal');
if (statsReportBtn) {
    statsReportBtn.addEventListener('click', async () => {
        showLoader();
        try {
            const [usersSnap, articlesSnap] = await Promise.all([
                get(ref(db, 'users')),
                get(ref(db, 'articles'))
            ]);
            const users = usersSnap.val() || {};
            const articles = articlesSnap.val() || {};
            const articlesArr = Object.values(articles);
            const totalArticles = articlesArr.length;
            const publishedArticles = articlesArr.filter(a => a.isPublished).length;
            const totalUsers = Object.keys(users).length;
            let totalLikes = 0;
            articlesArr.forEach(a => {
                if (a.likeCount) totalLikes += a.likeCount;
            });
            const usersArr = Object.values(users).map(u => ({
                name: `${u.lastName || ''} ${u.firstName || ''}`.trim() || 'Аноним',
                class: u.userClass || '-',
                xp: u.stats?.xp || 0
            }));
            usersArr.sort((a, b) => b.xp - a.xp);
            const top5 = usersArr.slice(0, 5);
            document.getElementById('report-date').textContent = new Date().toLocaleString('ru-RU');
            document.getElementById('stat-total-articles').textContent = totalArticles;
            document.getElementById('stat-published').textContent = publishedArticles;
            document.getElementById('stat-total-users').textContent = totalUsers;
            document.getElementById('stat-total-likes').textContent = totalLikes;
            const tbody = document.getElementById('stat-top-authors');
            tbody.innerHTML = '';
            const getRank = (xp) => {
                if(xp >= 25000) return "Легенда";
                if(xp >= 10000) return "Мастер пера";
                if(xp >= 4000) return "Спецкор";
                if(xp >= 1500) return "Журналист";
                if(xp >= 500) return "Корреспондент";
                if(xp >= 100) return "Стажёр";
                return "Новичок";
            };
            top5.forEach((u, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${escapeHTML(u.name)}</td>
                    <td>${escapeHTML(u.class)}</td>
                    <td><b>${u.xp}</b></td>
                    <td>${getRank(u.xp)}</td>
                `;
                tbody.appendChild(tr);
            });
            statsModal.classList.remove('hidden');
        } catch (e) {
            console.error(e);
            showNotification('Ошибка сбора статистики', 'error');
        } finally {
            hideLoader();
        }
    });
}
const checkGlobalNews = async (uid, role) => {
    if (role === 'admin') return;
    try {
        const newsSnap = await get(ref(db, 'global_news'));
        if (newsSnap.exists()) {
            const news = newsSnap.val();
            const userSnap = await get(ref(db, `users/${uid}/lastSeenNews`));
            const lastSeen = userSnap.val() || 0;
            if (news.timestamp > lastSeen) {
                showNotification(`📢 МОЛНИЯ:\n${news.text}`, 'warning');
                await update(ref(db, `users/${uid}`), { lastSeenNews: news.timestamp });
            }
        }
    } catch (e) {
        console.error(e);
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        showLoader();
        try {
            const roleRef = ref(db, 'roles/' + user.uid);
            const snapshot = await get(roleRef);
            userRole = snapshot.exists() ? snapshot.val() : 'editor';
            await renderUIForRole();
            checkUserProfile(); 
            checkGlobalNews(user.uid, userRole);
            if (typeof startSecurityMonitor === "function") {
                startSecurityMonitor(); 
            } else {
                console.warn("Функция startSecurityMonitor не найдена!");
            }
        } catch (error) {
            console.error("Ошибка инициализации:", error);
            showNotification("Не удалось загрузить данные пользователя.", "error");
        } finally {
            hideLoader();
        }
    } else {
        window.location.href = 'index.html';
    }
});
let lastScrollY = window.scrollY;
let scrollTimeout;
window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const speed = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;
    const tilt = Math.max(-15, Math.min(15, speed / 2));
    document.body.style.setProperty('--scroll-tilt', `${tilt}deg`);
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        document.body.style.setProperty('--scroll-tilt', '0deg');
    }, 100);
});
const initSidebar = async () => {
    const sidebar = document.getElementById('right-sidebar');
    const adminSettingsBlock = document.getElementById('admin-only-settings');
    if (!sidebar || userRole !== 'admin') {
        if (sidebar) sidebar.classList.add('hidden');
        return;
    }
    sidebar.classList.remove('hidden');
    if (adminSettingsBlock) adminSettingsBlock.classList.remove('hidden');
    const uid = auth.currentUser.uid;
    const equippedSnap = await get(ref(db, `users/${uid}/equipped`));
    const equippedData = equippedSnap.val() || {};
    const isAccountant = equippedData.title === 'accountant';
    const oldBox = document.getElementById('accountant-admin-box');
    if (oldBox) oldBox.remove(); 
    if (isAccountant) {
        const currentOverride = equippedData.title_override || "";
        const accountantHtml = `
            <div id="accountant-admin-box" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border-color);">
                <h4 class="sidebar-subtitle" style="color: var(--accent-color); font-size: 0.9rem; margin-bottom: 8px;">Статус Счетовода</h4>
                <select id="admin-accountant-select" class="btn-toggle" style="width:100%; background: var(--input-bg); color: white; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
                    <option value="" ${currentOverride === "" ? "selected" : ""}>-- По балансу (Авто) --</option>
                    <option value="📉 Коплю на булочку" ${currentOverride === "📉 Коплю на булочку" ? "selected" : ""}>📉 Коплю на булочку</option>
                    <option value="📈 Средний класс" ${currentOverride === "📈 Средний класс" ? "selected" : ""}>📈 Средний класс</option>
                    <option value="💰 Счетовод" ${currentOverride === "💰 Счетовод" ? "selected" : ""}>💰 Счетовод</option>
                    <option value="💰 Инвестор столовой" ${currentOverride === "💰 Инвестор столовой" ? "selected" : ""}>💰 Инвестор столовой</option>
                    <option value="👑 Олигарх 2121" ${currentOverride === "👑 Олигарх 2121" ? "selected" : ""}>👑 Олигарх 2121</option>
                </select>
                <p style="font-size: 0.7rem; color: var(--secondary-text-color); margin-top: 5px;">Этот статус будут видеть все в ленте</p>
            </div>
        `;
        adminSettingsBlock.insertAdjacentHTML('beforeend', accountantHtml);
        const accSelect = document.getElementById('admin-accountant-select');
        accSelect.addEventListener('change', async (e) => {
            const val = e.target.value;
            showLoader();
            try {
                await update(ref(db, `users/${uid}/equipped`), {
                    title_override: val || null
                });
                showNotification("Статус титула изменен!");
                if (typeof fetchArticles === 'function') fetchArticles();
            } catch (err) {
                console.error(err);
                showNotification("Ошибка сохранения", "error");
            } finally {
                hideLoader();
            }
        });
    }
    setupTogglesForAdmin();

    const btnSendNews = document.getElementById('btn-send-news');
    const adminNewsInput = document.getElementById('admin-news-input');
    if (btnSendNews && adminNewsInput) {
        btnSendNews.addEventListener('click', async () => {
            const text = adminNewsInput.value.trim();
            if (!text) return showNotification('Введите текст новости', 'error');
            showLoader();
            try {
                await set(ref(db, 'global_news'), {
                    text: text,
                    timestamp: Date.now()
                });
                showNotification('Новость успешно разослана!');
                adminNewsInput.value = '';
            } catch(e) {
                console.error(e);
                showNotification('Ошибка при рассылке', 'error');
            } finally {
                hideLoader();
            }
        });
    }

    const statsBtn = document.getElementById('stats-report-btn');
    if (statsBtn) {
        const newStatsBtn = statsBtn.cloneNode(true);
        statsBtn.parentNode.replaceChild(newStatsBtn, statsBtn);
        newStatsBtn.addEventListener('click', async () => {
            showLoader();
            try {
                const [usersSnap, articlesSnap] = await Promise.all([
                    get(ref(db, 'users')),
                    get(ref(db, 'articles'))
                ]);
                const users = usersSnap.val() || {};
                const articles = articlesSnap.val() || {};
                const articlesArr = Object.values(articles);
                document.getElementById('stat-total-articles').textContent = articlesArr.length;
                document.getElementById('stat-published').textContent = articlesArr.filter(a => a.isPublished).length;
                document.getElementById('stat-total-users').textContent = Object.keys(users).length;
                let totalLikes = 0;
                articlesArr.forEach(a => { if (a.likeCount) totalLikes += a.likeCount; });
                document.getElementById('stat-total-likes').textContent = totalLikes;
                const usersArr = Object.values(users).map(u => ({
                    name: `${u.lastName || ''} ${u.firstName || ''}`.trim() || 'Аноним',
                    class: u.userClass || '-',
                    xp: u.stats?.xp || 0
                }));
                usersArr.sort((a, b) => b.xp - a.xp);
                const tbody = document.getElementById('stat-top-authors');
                tbody.innerHTML = '';
                const getRank = (xp) => {
                    if(xp >= 25000) return "Легенда";
                    if(xp >= 10000) return "Мастер пера";
                    if(xp >= 4000) return "Спецкор";
                    if(xp >= 1500) return "Журналист";
                    if(xp >= 500) return "Корреспондент";
                    if(xp >= 100) return "Стажёр";
                    return "Новичок";
                };
                usersArr.slice(0, 5).forEach((u, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${index + 1}</td><td>${escapeHTML(u.name)}</td><td>${escapeHTML(u.class)}</td><td><b>${u.xp}</b></td><td>${getRank(u.xp)}</td>`;
                    tbody.appendChild(tr);
                });
                document.getElementById('stats-modal').classList.remove('hidden');
            } catch (e) {
                console.error(e);
                showNotification('Ошибка статистики', 'error');
            } finally {
                hideLoader();
            }
        });
    }
};
const setupTogglesForAdmin = () => {
    const rawCosmSw = document.getElementById('toggle-raw-cosmetics');
    if (rawCosmSw) {
        rawCosmSw.checked = localStorage.getItem('pref_raw_cosmetics') === 'true';
        rawCosmSw.addEventListener('change', (e) => {
            localStorage.setItem('pref_raw_cosmetics', e.target.checked);
        });
    }

    const setupVisibilityToggle = (switchId, mobSwitchId, sectionId, storageKey) => {
        const deskSw = document.getElementById(switchId);
        const mobSw = document.getElementById(mobSwitchId);
        const section = document.getElementById(sectionId);
        if (!deskSw) return; 
        const isVisible = localStorage.getItem(storageKey) !== 'false'; 
        if(deskSw) deskSw.checked = isVisible;
        if(mobSw) mobSw.checked = isVisible;
        if (section) {
            if (isVisible) section.classList.remove('hidden');
            else section.classList.add('hidden');
        }
        const handleToggle = (e) => {
            const checked = e.target.checked;
            localStorage.setItem(storageKey, checked);
            if(deskSw) deskSw.checked = checked;
            if(mobSw) mobSw.checked = checked;
            if (checked) section.classList.remove('hidden');
            else section.classList.add('hidden');
        };
        if(deskSw) deskSw.onclick = handleToggle;
        if(mobSw) mobSw.onclick = handleToggle;
    };
    setupVisibilityToggle('toggle-singularity', 'mob-singularity', 'singularity-section', 'pref_show_singularity');
};
const recalculateMentorStats = async () => {
    const uid = auth.currentUser.uid;
    try {
        const apprenticesSnap = await get(ref(db, `users/${uid}/mentorship/apprentices`));
        if (!apprenticesSnap.exists()) return; 
        const apprenticesIds = Object.keys(apprenticesSnap.val());
        let realScore = 0;
        const checkPromises = apprenticesIds.map(async (studentId) => {
            const articlesRef = query(ref(db, 'articles'), orderByChild('authorId'), equalTo(studentId));
            const snapshot = await get(articlesRef);
            if (snapshot.exists()) {
                const articles = snapshot.val();
                Object.values(articles).forEach(art => {
                    if (art.isPublished) {
                        realScore++;
                    }
                });
            }
        });
        await Promise.all(checkPromises);
        await update(ref(db), {
            [`users/${uid}/stats/menteePublishedCount`]: realScore
        });
        console.log(`Статистика наставника обновлена. Реальный счет: ${realScore}`);
    } catch (e) {
        console.error("Ошибка пересчета наставничества:", e);
    }
};