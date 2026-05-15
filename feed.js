import { 
    db, auth, showNotification, escapeHTML,
    ref, onValue, runTransaction, get, update, increment, query, orderByChild, equalTo,
    onAuthStateChanged 
} from './firebase-init.js';
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
const feedContainer = document.getElementById('feed-container');
const sortNewBtn = document.getElementById('sort-new');
const sortTopBtn = document.getElementById('sort-top');
const loginBtn = document.getElementById('login-btn');
const dashboardBtn = document.getElementById('dashboard-btn');
let allArticles =[];
let currentSort = 'new';
let currentUser = null;
let currentUserWeight = 1; // Вес лайка текущего пользователя

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        if(loginBtn) loginBtn.classList.add('hidden');
        if(dashboardBtn) dashboardBtn.classList.remove('hidden');
        
        try {
            const [userSnap, overrideSnap] = await Promise.all([
                get(ref(db, `users/${user.uid}`)),
                get(ref(db, `userStats/${user.uid}`))
            ]);
            const xp = userSnap.val()?.stats?.xp || 0;
            const overrides = overrideSnap.val() || {};
            let displayRankTitle = RANKS_CONFIG[0].title;
            for (let i = 0; i < RANKS_CONFIG.length; i++) {
                if (xp >= RANKS_CONFIG[i].xp) displayRankTitle = RANKS_CONFIG[i].title;
                else break;
            }
            if (overrides.rank) displayRankTitle = overrides.rank;
            
            if (["Журналист", "Спецкор"].includes(displayRankTitle)) currentUserWeight = 2;
            else if (["Мастер пера", "Легенда"].includes(displayRankTitle)) currentUserWeight = 3;
            else currentUserWeight = 1;
        } catch(e) {
            console.error("Ошибка расчета ранга лайка:", e);
        }

    } else {
        if(loginBtn) loginBtn.classList.remove('hidden');
        if(dashboardBtn) dashboardBtn.classList.add('hidden');
    }
    renderFeed(); 
});
const loadArticlesOnce = async () => {
    try {
        const articlesRef = ref(db, 'articles');
        const snapshot = await get(articlesRef);
        feedContainer.innerHTML = ''; 
        allArticles = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.entries(data).forEach(([id, article]) => {
                if (article.isPublished && article.publishAt) {
                    allArticles.push({ id, ...article });
                }
            });
            renderFeed(); 
        } else {
            feedContainer.innerHTML = `
                <div style="text-align:center; color: var(--secondary-text-color); margin-top: 50px;">
                    <h2>📭 Лента пуста</h2>
                    <p>Главред еще не опубликовал ни одной статьи.</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("Ошибка загрузки статей:", e);
        feedContainer.innerHTML = '<div class="loader-placeholder">Ошибка загрузки ленты...</div>';
    }
};
loadArticlesOnce();
sortNewBtn.addEventListener('click', () => { setSort('new'); });
sortTopBtn.addEventListener('click', () => { setSort('top'); });
const setSort = (mode) => {
    currentSort = mode;
    sortNewBtn.classList.toggle('active', mode === 'new');
    sortTopBtn.classList.toggle('active', mode === 'top');
    renderFeed();
};
const renderFeed = () => {
    feedContainer.innerHTML = '';
    if (allArticles.length === 0) return; 
    const sorted = [...allArticles].sort((a, b) => {
        if (currentSort === 'new') {
            return b.publishAt - a.publishAt; 
        } else {
            const likesA = a.likeCount || 0;
            const likesB = b.likeCount || 0;
            return likesB - likesA; 
        }
    });
    sorted.forEach((article, index) => {
        const card = document.createElement('div');
        card.className = 'article-card feed-card';
        const date = new Date(article.publishAt).toLocaleDateString('ru-RU');
        const likes = article.likeCount || 0;
        const userLikeVal = currentUser && article.likes && article.likes[currentUser.uid];
        const isLiked = !!userLikeVal;
        const appliedWeight = typeof userLikeVal === 'number' ? userLikeVal : 1;
        const heartIcon = isLiked ? '❤️' : '🤍';
        const likeClass = isLiked ? 'liked' : '';
        let imagesListHtml = '';
        let inlineImagesHtml = '';
        let directImagesCount = 0;
        let photos = [];
        if (article.images && Array.isArray(article.images)) {
            photos = article.images;
        } else if (article.image) {
            photos = [article.image];
        }
        
        const isDirectImage = (u) => /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(u);

        if (photos.length > 0 || article.videoUrl) {
            imagesListHtml = `<div class="article-images-list">`;
            photos.forEach((url, index) => {
                const safeUrl = url.replace(/["'<>]/g, '');
                if (safeUrl.toLowerCase().trim().startsWith('javascript:')) return;
                
                if (isDirectImage(safeUrl)) {
                    inlineImagesHtml += `<a href="${escapeHTML(safeUrl)}" target="_blank" class="collage-item"><img src="${escapeHTML(safeUrl)}" alt="Фото к статье"></a>`;
                    directImagesCount++;
                } else {
                    imagesListHtml += `
                        <a href="${escapeHTML(safeUrl)}" target="_blank" class="article-image-link">
                            📷 Фото ${index + 1}
                        </a>
                    `;
                }
            });
            if (article.videoUrl) {
                const safeVid = article.videoUrl.replace(/["'<>]/g, '');
                if (!safeVid.toLowerCase().trim().startsWith('javascript:')) {
                    imagesListHtml += `
                        <a href="${escapeHTML(safeVid)}" target="_blank" class="article-image-link">
                            🎥 Видео
                        </a>
                    `;
                }
            }
            imagesListHtml += `</div>`;
        }
        
        if (inlineImagesHtml) {
            const collageClass = directImagesCount > 4 ? 'article-image-collage many' : 'article-image-collage';
            inlineImagesHtml = `<div class="${collageClass}" data-count="${directImagesCount}">${inlineImagesHtml}</div>`;
        }
        
        card.innerHTML = `
            <!-- БЛОК АВТОРА (КЛИКАБЕЛЬНЫЙ) -->
            <div class="feed-author-area clickable-author" onclick="window.openDossier('${article.authorId}')">
                <div class="feed-avatar-placeholder">👤</div>
                <div class="feed-author-info">
                    <div class="feed-author-name">${escapeHTML(article.authorName)}</div>
                    <div class="feed-author-rank">Загрузка...</div>
                </div>
            </div>
            ${imagesListHtml} <!-- Ссылки перед заголовком -->
            <h3 style="margin-top: 10px;">${escapeHTML(article.title)}</h3>
            <p class="article-text">${parseMarkdown(article.text)}</p>
            ${inlineImagesHtml} <!-- Картинки напрямую -->
            <div class="article-meta" style="margin-top: 15px; justify-content: space-between;">
                <span>📅 Опубликовано: ${date}</span>
                <div class="feed-actions" style="margin:0; border:none; padding:0;">
                    <button class="btn-like ${likeClass}" data-id="${article.id}" data-author="${article.authorId}" data-weight="${appliedWeight}">
                        ${heartIcon} <span class="like-count">${likes}</span>
                    </button>
                </div>
            </div>
        `;
        loadAuthorData(article.authorId, article.id, card);
        card.addEventListener('click', (e) => {
            if(
                e.target.closest('.btn-like') || 
                e.target.closest('.article-image-link') || 
                e.target.closest('.collage-item') || 
                e.target.closest('.feed-author-area')
            ) {
                return; 
            }
            window.location.href = `article.html?id=${article.id}`;
        });
        const likeBtn = card.querySelector('.btn-like');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            handleLike(article.id, article.authorId, e);
        });
        feedContainer.appendChild(card);
        setTimeout(() => card.classList.add('fade-in'), index * 50);
    });
};
const loadAuthorData = async (authorId, articleId, cardElement) => {
    try {
        const [userSnap, overrideSnap] = await Promise.all([
            get(ref(db, `users/${authorId}`)),
            get(ref(db, `userStats/${authorId}`))
        ]);
        const userData = userSnap.val() || {};
        const overrides = overrideSnap.exists() ? overrideSnap.val() : {};
        const equipped = userData.equipped || {};
        const stats = userData.stats || {};
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
        const authorArea = cardElement.querySelector('.feed-author-area');
        if (!authorArea) return;
        const avatarPlaceholder = authorArea.querySelector('.feed-avatar-placeholder');
        const rankDiv = authorArea.querySelector('.feed-author-rank');
        if (!rankDiv) return;
        if (avatarPlaceholder) {
            avatarPlaceholder.className = 'feed-avatar-placeholder'; 
            let avatarImg = `<span>👤</span>`;
            if (equipped.avatar) {
                avatarImg = `<img src="${escapeHTML(equipped.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            }
            avatarPlaceholder.innerHTML = `<div class="aura-container">${avatarImg}</div>`;
            const auraContainer = avatarPlaceholder.querySelector('.aura-container');
            if (equipped.border) {
                const smartClasses = getSmartBorderClasses(equipped.border, xp, displayRankTitle);
                cardElement.classList.add(...smartClasses);
            }
            if (equipped.aura && auraContainer) auraContainer.classList.add(equipped.aura);
            if (equipped.aura_reverse && auraContainer) auraContainer.classList.add(equipped.aura_reverse);
        }
        let htmlContent = '';
        if (overrides.rank) {
            htmlContent += `<span class="rank-tag" style="border-color:var(--accent-color); color:var(--accent-color); margin-right:5px;">${escapeHTML(displayRankTitle)}</span>`;
        } else {
            htmlContent += `<span class="rank-tag" style="margin-right:5px;">${escapeHTML(displayRankTitle)}</span>`;
        }
        let titleVal = equipped.title;
        let specialClass = '';
        if (titleVal && titleVal.toString().trim().toLowerCase() === 'accountant') {
            if (equipped.title_override) {
                titleVal = equipped.title_override;
            } else {
                const bal = stats.balance || 0;
                if (bal < 500) titleVal = "📉 Коплю на булочку";
                else if (bal < 3000) titleVal = "📈 Средний класс";
                else if (bal < 7000) titleVal = "💵 Счетовод";
                else if (bal < 15000) titleVal = "💰 Инвестор столовой";
                else titleVal = "👑 Олигарх 2121";
            }
        }
        else if (titleVal === 'Повелитель Света') specialClass = 'special-light';
        else if (titleVal === 'Владыка Тьмы') specialClass = 'special-dark';
        if (titleVal) {
            htmlContent += `<span class="rank-tag title-tag ${specialClass}">${escapeHTML(titleVal)}</span>`;
        }
        rankDiv.innerHTML = htmlContent;
    } catch (e) {
        console.error("Ошибка загрузки автора:", e);
        const rankDiv = cardElement.querySelector('.feed-author-rank');
        if (rankDiv) rankDiv.textContent = "Ошибка профиля";
    }
};
const handleLike = async (articleId, authorId, event) => {
    if (!currentUser) {
        showNotification('Войдите, чтобы ставить лайки!', 'error');
        return;
    }
    if (currentUser.uid === authorId) {
        showNotification('Нельзя лайкать самого себя! Это нескромно.', 'error');
        return;
    }
    const likeButton = event.target.closest('.btn-like');
    if (!likeButton) return;
    const likeCountSpan = likeButton.querySelector('.like-count');
    let currentLikes = parseInt(likeCountSpan.textContent);
    const isLiked = likeButton.classList.contains('liked');
    const appliedWeight = parseInt(likeButton.dataset.weight) || 1;
    
    const updates = {};
    if (isLiked) {
        updates[`articles/${articleId}/likes/${currentUser.uid}`] = null;
        updates[`articles/${articleId}/likeCount`] = increment(-appliedWeight);
        updates[`users/${authorId}/stats/totalLikes`] = increment(-appliedWeight);
        
        likeButton.classList.remove('liked');
        likeButton.dataset.weight = 0;
        likeButton.innerHTML = `🤍 <span class="like-count">${currentLikes - appliedWeight}</span>`;
    } else {
        updates[`articles/${articleId}/likes/${currentUser.uid}`] = currentUserWeight;
        updates[`articles/${articleId}/likeCount`] = increment(currentUserWeight);
        updates[`users/${authorId}/stats/totalLikes`] = increment(currentUserWeight);
        
        likeButton.classList.add('liked');
        likeButton.dataset.weight = currentUserWeight;
        likeButton.innerHTML = `❤️ <span class="like-count">${currentLikes + currentUserWeight}</span>`;
    }
    
    try {
        await update(ref(db), updates);
    } catch (e) {
        console.error("Ошибка лайка:", e);
        showNotification('Не удалось поставить лайк. Возможно, вы пытаетесь лайкнуть себя?', 'error');
        if (isLiked) {
            likeButton.classList.add('liked');
            likeButton.dataset.weight = appliedWeight;
            likeButton.innerHTML = `❤️ <span class="like-count">${currentLikes}</span>`;
        } else {
            likeButton.classList.remove('liked');
            likeButton.dataset.weight = 0;
            likeButton.innerHTML = `🤍 <span class="like-count">${currentLikes}</span>`;
        }
    }
};
const parseMarkdown = (text) => {
    if (!text) return '';
    let html = escapeHTML(text); 
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/__(.*?)__/g, '<i>$1</i>');
    html = html.replace(/&gt;&gt; (.*)/g, '<blockquote>$1</blockquote>');
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, title, url) => {
        const cleanUrl = url.replace(/["'<>]/g, '');
        if (/^https?:\/\//i.test(cleanUrl)) {
            return `<a href="${cleanUrl}" target="_blank" style="color:var(--accent-color); text-decoration:underline;">${title}</a>`;
        }
        return `<span>${title} (ссылка удалена)</span>`;
    });
    return html;
};
window.openDossier = async (uid) => {
    const modal = document.getElementById('dossier-modal');
    const content = document.getElementById('dossier-content');
    content.innerHTML = '<div style="text-align:center; padding: 20px;">Загрузка досье...</div>';
    modal.classList.remove('hidden');
    try {
        const [userSnap, articlesSnap, statsOverrideSnap] = await Promise.all([
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
        if (equipped.aura_reverse) {
            visualClasses += ' ' + equipped.aura_reverse;
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