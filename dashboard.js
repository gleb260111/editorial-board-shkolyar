// Импорт из Firebase SDK и общего файла
import { db, auth, showLoader, hideLoader, showNotification } from './firebase-init.js';
import { ref, onValue, push, set, remove, update, query, orderByChild, equalTo, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// --- КОНФИГУРАЦИЯ РАНГОВ И АЧИВОК ---
const RANKS_CONFIG = [
    { count: 0, title: "Новичок" },
    { count: 1, title: "Стажёр" },
    { count: 3, title: "Корреспондент" },
    { count: 7, title: "Журналист" },
    { count: 15, title: "Спецкор" },
    { count: 30, title: "Мастер пера" },
    { count: 50, title: "Легенда" }
];

const ACHIEVEMENTS_CONFIG = [
    // --- Старые базовые ---
    { id: 'first_step', icon: '🏁', title: 'Первый шаг', desc: 'Подана 1 статья', check: (arts) => arts.length >= 1 },
    { id: 'on_fire', icon: '🔥', title: 'В ударе', desc: 'Подано 5 статей', check: (arts) => arts.length >= 5 },
    { id: 'veteran', icon: '🎓', title: 'Профи', desc: 'Подано 10 статей', check: (arts) => arts.length >= 10 },
    { id: 'legend_club', icon: '💎', title: 'Юбиляр', desc: 'Подано 25 статей', check: (arts) => arts.length >= 25 },
    
    // --- По времени ---
    { id: 'night_owl', icon: '🦉', title: 'Ночная сова', desc: 'Подача с 00:00 до 05:00', check: (arts) => arts.some(a => {
        const h = new Date(a.createdAt).getHours();
        return h >= 0 && h < 5;
    })},
    { id: 'early_bird', icon: '🌅', title: 'Жаворонок', desc: 'Подача с 06:00 до 09:00', check: (arts) => arts.some(a => {
        const h = new Date(a.createdAt).getHours();
        return h >= 6 && h <= 9;
    })},
    { id: 'weekend', icon: '📅', title: 'Постоянство', desc: 'Подача в субботу или воскресенье', check: (arts) => arts.some(a => {
        const d = new Date(a.createdAt).getDay();
        return d === 0 || d === 6; 
    })},

    // --- По контенту ---
    { id: 'tolstoy', icon: '📜', title: 'Лев Толстой', desc: 'Статья длиннее 3000 символов', check: (arts) => arts.some(a => a.text.length > 3000) },
    
    { id: 'clickbait', icon: '📢', title: 'Громкий заголовок', desc: 'Заголовок с "!" или "?"', check: (arts) => arts.some(a => a.title.includes('!') || a.title.includes('?')) },
    
    { id: 'school_patriot', icon: '🏫', title: 'Школьный патриот', desc: 'Текст про школу, учителей или уроки', check: (arts) => arts.some(a => {
        const text = a.text.toLowerCase();
        return /школ|учител|урок|класс|экзамен|директор/i.test(text);
    })},

    // --- Сложные ---
    { id: 'trusted', icon: '🤝', title: 'Любимчик редакции', desc: '3 опубликованные статьи', check: (arts) => arts.filter(a => a.isPublished).length >= 3 },

    { id: 'news_machine', icon: '⚡', title: 'Машина новостей', desc: '3 статьи за один день', check: (arts) => {
        const dates = {};
        arts.forEach(a => {
            const d = new Date(a.createdAt).toLocaleDateString();
            dates[d] = (dates[d] || 0) + 1;
        });
        return Object.values(dates).some(count => count >= 3);
    }}
];

// --- Глобальные переменные ---
let userRole = 'editor';
let currentEditingId = null;
const SORT_MODE_KEY = 'editorialBoardSortMode';
let currentSortMode = localStorage.getItem(SORT_MODE_KEY) || 'submission';
const articlesRef = ref(db, 'articles');
const MIN_TEXTAREA_HEIGHT = 180;

// --- DOM Элементы ---
const mainHeader = document.getElementById('main-header');
const logoutBtn = document.getElementById('logout-btn');
const mainContent = document.getElementById('main-content');
const formWrapper = document.getElementById('form-wrapper'); 
const articleFormSection = document.getElementById('article-form-section');
const articleForm = document.getElementById('article-form');
const createArticleBtn = document.getElementById('create-article-btn');
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

// --- Функции UI ---

const checkTextareaOverflow = () => {
    const hasOverflow = textTextarea.scrollHeight > MIN_TEXTAREA_HEIGHT;
    toggleTextBtn.classList.toggle('hidden', !hasOverflow);
    if (!hasOverflow && textTextarea.dataset.expanded === 'true') {
        textTextarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
        toggleTextBtn.textContent = 'Развернуть';
        textTextarea.dataset.expanded = 'false';
    }
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
    if (userRole !== 'editor') {
        formWrapper.classList.add('modal-overlay');
        articleFormSection.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 
    }
};

const closeModal = () => {
    if (userRole !== 'editor') {
        formWrapper.classList.remove('modal-overlay');
        articleFormSection.classList.add('hidden');
        document.body.style.overflow = ''; 
    }
    resetForm();
};

const resetForm = () => {
    articleForm.reset();
    document.getElementById('articleId').value = '';
    currentEditingId = null;
    formTitle.textContent = 'Подать новую статью';
    submitBtn.textContent = 'Отправить';
    
    if (userRole === 'editor') {
        cancelEditBtn.classList.add('hidden');
    } else {
        cancelEditBtn.classList.remove('hidden');
        cancelEditBtn.textContent = 'Отмена';
    }

    textTextarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
    textTextarea.dataset.expanded = 'false';
    checkTextareaOverflow();
};

// --- Обработчики событий ---

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
    if (userRole === 'editor') {
        resetForm();
    } else {
        closeModal();
    }
};

// Функция стала ASYNC, потому что мы лезем в базу
const calculateAndRenderStats = async (allArticles) => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const statsSection = document.getElementById('user-stats-section');
        if (!statsSection) return;

        // 1. Получаем "Ручные" настройки из базы
        const snapshot = await get(ref(db, `userStats/${currentUser.uid}`));
        const overrides = snapshot.exists() ? snapshot.val() : {};

        // 2. Считаем автоматику
        const myArticles = allArticles.filter(a => a.authorId === currentUser.uid);
        const count = myArticles.length;

        let currentRank = RANKS_CONFIG[0];
        let nextRank = null;

        // Если ранг задан вручную админом - берем его, иначе считаем
        if (overrides.rank) {
            currentRank = { title: overrides.rank, count: 0 }; // count 0 заглушка
            nextRank = null; // Если ранг ручной, прогресс бар скрываем или делаем полным
        } else {
            for (let i = 0; i < RANKS_CONFIG.length; i++) {
                if (count >= RANKS_CONFIG[i].count) {
                    currentRank = RANKS_CONFIG[i];
                    nextRank = RANKS_CONFIG[i + 1] || null;
                } else {
                    break;
                }
            }
        }

        // 3. Рендер UI
        statsSection.classList.remove('hidden');
        
        const elUsername = document.getElementById('stats-username');
        if (elUsername) elUsername.textContent = currentUser.email.split('@')[0];

        const elRank = document.getElementById('stats-rank');
        if (elRank) elRank.textContent = currentRank.title;
        // Подсветка, если ранг выдан вручную
        if (overrides.rank) elRank.style.borderColor = '#ff00d4'; 

        const progressBar = document.getElementById('rank-progress');
        const progressText = document.getElementById('progress-text');
        const nextRankName = document.getElementById('next-rank-name');

        if (progressBar && progressText && nextRankName) {
            if (overrides.rank) {
                // Если ранг ручной - показываем "Спец. статус"
                progressBar.style.width = '100%';
                progressBar.style.background = 'linear-gradient(90deg, #ff00d4, #aa00ff)';
                progressText.textContent = `${count} статей (Всего)`;
                nextRankName.textContent = 'Специальный ранг';
            } else if (nextRank) {
                const percent = Math.min(100, Math.round((count / nextRank.count) * 100));
                progressBar.style.width = `${percent}%`;
                progressBar.style.background = ''; // сброс цвета
                progressText.textContent = `${count} / ${nextRank.count} статей`;
                nextRankName.textContent = `Следующий: ${nextRank.title}`;
            } else {
                progressBar.style.width = '100%';
                progressBar.style.background = '';
                progressText.textContent = `${count} статей`;
                nextRankName.textContent = 'Максимальный уровень!';
            }
        }

        // 4. Ачивки (Гибрид: Автоматические + Ручные)
        const achievementsGrid = document.getElementById('achievements-grid');
        if (achievementsGrid) {
            achievementsGrid.innerHTML = ''; 
            const forcedAchievements = overrides.achievements || {}; // { 'achievement_id': true }

            ACHIEVEMENTS_CONFIG.forEach(ach => {
                // Ачивка есть, если выполнено условие ИЛИ если админ её выдал
                const isAutoUnlocked = ach.check(myArticles);
                const isForced = forcedAchievements[ach.id] === true;
                const isUnlocked = isAutoUnlocked || isForced;

                const div = document.createElement('div');
                div.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
                // Если выдана админом, добавим золотую рамку или пометку
                if (isForced) div.style.borderColor = '#ff00d4';
                
                div.title = ach.desc + (isForced ? ' (Выдано Главредом)' : '');
                div.innerHTML = `<span class="achievement-icon">${ach.icon}</span> <span>${ach.title}</span>`;
                achievementsGrid.appendChild(div);
            });
        }

    } catch (e) {
        console.error("Ошибка при расчете статистики:", e);
    }
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const articleData = { 
        title: document.getElementById('title').value.trim(), 
        text: document.getElementById('text').value.trim(), 
        authorName: document.getElementById('authorName').value.trim(), 
        authorClass: document.getElementById('authorClass').value.trim() 
    };
    
    if (!articleData.title || !articleData.text || !articleData.authorName || !articleData.authorClass) {
        showNotification('Пожалуйста, заполните все поля.', 'error');
        return;
    }

    showLoader();
    try {
        if (currentEditingId) {
            await update(ref(db, `articles/${currentEditingId}`), articleData);
            showNotification('Статья успешно обновлена!');
        } else {
            const currentUser = auth.currentUser;
            if (!currentUser) { showNotification('Ошибка: вы не авторизованы.', 'error'); return; }
            await set(push(articlesRef), { 
                ...articleData, 
                authorId: currentUser.uid, 
                createdAt: serverTimestamp(), 
                isPublished: false, 
                publishAt: null, 
                preventDeletion: false 
            });
            showNotification('Статья успешно подана!');
        }
        
        if (userRole === 'editor') {
            resetForm();
        } else {
            closeModal(); 
        }
        await fetchArticles();
    } catch (error) {
        showNotification('Произошла ошибка при сохранении.', 'error');
        console.error(error);
    } finally {
        hideLoader();
    }
};

const handleDelete = async (id) => {
    if (confirm('Вы уверены, что хотите удалить эту статью?')) {
        showLoader();
        try {
            await remove(ref(db, `articles/${id}`));
            showNotification('Статья удалена.');
            await fetchArticles();
        } catch (error) {
            showNotification('Ошибка при удалении.', 'error');
        } finally {
            hideLoader();
        }
    }
};

const handlePublishDateChange = async (id, dateString) => {
    showLoader();
    try {
        const publishTimestamp = dateString ? new Date(dateString).getTime() : null;
        const isPublished = !!dateString;
        await update(ref(db, `articles/${id}`), { publishAt: publishTimestamp, isPublished: isPublished });
        await fetchArticles();
    } catch (error) {
        showNotification('Ошибка при обновлении даты.', 'error');
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

// --- Рендеринг ---

const createArticleCard = (article) => {
    const card = document.createElement('div');
    card.className = 'article-card collapsed';
    card.dataset.id = article.id;
    const createdAt = new Date(article.createdAt).toLocaleString('ru-RU');
    const publishAtDate = article.publishAt ? new Date(article.publishAt) : null;
    const publishAt = article.isPublished && publishAtDate ? `Опубликовать: ${publishAtDate.toLocaleDateString('ru-RU')}` : 'Не опубликовано';
    const publishAtForInput = publishAtDate ? publishAtDate.toISOString().split('T')[0] : '';
    
    let editorAdminControls = '';
    const isAuthor = auth.currentUser && auth.currentUser.uid === article.authorId;
    
    // Кнопки управления
    if (isAuthor || userRole === 'admin') {
        editorAdminControls = `<button class="btn btn-secondary edit-btn">Редактировать</button><button class="btn btn-danger delete-btn">Удалить</button>`;
    }

    // НОВОЕ: Кнопка управления юзером (Только для Админа и НЕ на своих статьях... или и на своих тоже)
    if (userRole === 'admin') {
        // Добавляем кнопку с иконкой человечка
        editorAdminControls += `<button class="btn btn-secondary user-manage-btn" style="margin-left:5px;" title="Управление рангом и ачивками автора">👤</button>`;
    }

    let adminSpecificControls = '';
    if (userRole === 'admin') {
        adminSpecificControls = `<div class="admin-card-controls"><label>Дата публикации: <input type="text" class="publish-date-input" value="${publishAtForInput}" placeholder="Выберите дату..."></label><label class="custom-checkbox-label"><input type="checkbox" class="prevent-deletion-checkbox" ${article.preventDeletion ? 'checked' : ''}><span class="custom-checkbox-visual"></span> Не удалять автоматически</label></div>`;
    }
    
    card.innerHTML = `<h3>${article.title}</h3><p class="article-text">${article.text}</p><div class="article-meta"><span>Автор: ${article.authorName}, ${article.authorClass}</span><span>Подано: ${createdAt}</span><span>Статус: ${publishAt}</span></div><div class="card-controls">${editorAdminControls}<button class="btn btn-toggle">Развернуть</button></div>${adminSpecificControls}`;

    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) editBtn.addEventListener('click', () => handleEdit(article));

    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) deleteBtn.addEventListener('click', () => handleDelete(article.id));

    const userManageBtn = card.querySelector('.user-manage-btn');
    if (userManageBtn) {
        userManageBtn.addEventListener('click', () => openUserManager(article.authorId, article.authorName));
    }

    const toggleBtn = card.querySelector('.btn-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => { card.classList.toggle('collapsed'); toggleBtn.textContent = card.classList.contains('collapsed') ? 'Развернуть' : 'Свернуть'; });

    if (userRole === 'admin') {
        const dateInput = card.querySelector('.publish-date-input');
        flatpickr(dateInput, { dateFormat: "Y-m-d", allowInput: false, locale: "ru" });
        dateInput.addEventListener('change', (e) => handlePublishDateChange(article.id, e.target.value));
        card.querySelector('.prevent-deletion-checkbox').addEventListener('change', (e) => handlePreventDeletionChange(article.id, e.target.checked));
    }
    return card;
};

const fetchArticles = () => new Promise((resolve) => {
    const currentUser = auth.currentUser;
    if (!currentUser) { resolve(); return; }
    
    const queryRef = (userRole === 'admin' || userRole === 'manager') ? articlesRef : query(articlesRef, orderByChild('authorId'), equalTo(currentUser.uid));
    
    onValue(queryRef, (snapshot) => {
        articlesContainer.innerHTML = '';
        const articlesData = snapshot.val();
        
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
                articlesContainer.appendChild(card);
                setTimeout(() => card.classList.add('fade-in'), index * 50);
            });
        } else {
            calculateAndRenderStats([]);
        }
        resolve();
    }, { onlyOnce: true });
});

const renderUIForRole = async () => {
    mainContent.classList.remove('hidden');
    formWrapper.className = '';
    createArticleBtn.classList.add('hidden');
    articleFormSection.classList.add('hidden');
    adminControls.classList.add('hidden');

    switch (userRole) {
        case 'admin':
            mainHeader.textContent = 'Панель Главреда';
            articlesListHeader.textContent = 'Все статьи на рассмотрении';
            adminControls.classList.remove('hidden');
            createArticleBtn.classList.remove('hidden');
            createArticleBtn.textContent = '+ Написать статью';
            break;
            
        case 'manager':
            mainHeader.textContent = 'Панель Управляющего';
            articlesListHeader.textContent = 'Все статьи';
            createArticleBtn.classList.remove('hidden'); 
            createArticleBtn.textContent = '+ Написать статью';
            break;
            
        default: 
            mainHeader.textContent = 'Редколлегия Школяр 2121';
            articlesListHeader.textContent = 'Мои статьи';
            articleFormSection.classList.remove('hidden');
            resetForm();
            break;
    }
    await fetchArticles();
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

// --- Инициализация ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        showLoader();
        try {
            const roleRef = ref(db, 'roles/' + user.uid);
            const snapshot = await get(roleRef);
            userRole = snapshot.exists() ? snapshot.val() : 'editor';
            await renderUIForRole();
        } catch (error) {
            console.error("Ошибка получения роли пользователя:", error);
            showNotification("Не удалось загрузить данные пользователя.", "error");
        } finally {
            hideLoader();
        }
    } else {
        window.location.href = 'index.html';
    }
});

// --- ЛОГИКА АДМИНКИ (УПРАВЛЕНИЕ ЮЗЕРОМ) ---

const userManagerModal = document.getElementById('user-manager-modal');
const manageUserName = document.getElementById('manage-user-name');
const manageUserId = document.getElementById('manage-user-id');
const manageRankSelect = document.getElementById('manage-rank-select');
const manageAchievementsList = document.getElementById('manage-achievements-list');
const saveUserStatsBtn = document.getElementById('save-user-stats-btn');
const closeUserManagerBtn = document.getElementById('close-user-manager-btn');

// Открыть окно управления
const openUserManager = async (authorId, authorName) => {
    if (userRole !== 'admin') return;

    showLoader();
    try {
        // 1. Загружаем текущие настройки юзера
        const snapshot = await get(ref(db, `userStats/${authorId}`));
        const overrides = snapshot.exists() ? snapshot.val() : {};

        // 2. Заполняем модалку
        manageUserName.textContent = authorName;
        manageUserId.value = authorId;
        manageRankSelect.value = overrides.rank || ""; // Если нет, то пустая строка (Авто)

        // 3. Генерируем чекбоксы ачивок
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

        // 4. Показываем
        userManagerModal.classList.remove('hidden');

    } catch (e) {
        console.error(e);
        showNotification('Ошибка загрузки данных пользователя', 'error');
    } finally {
        hideLoader();
    }
};

// Сохранить настройки
saveUserStatsBtn.addEventListener('click', async () => {
    const uid = manageUserId.value;
    const newRank = manageRankSelect.value;
    
    // Собираем ачивки
    const achievementsObj = {};
    const checkboxes = manageAchievementsList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (cb.checked) achievementsObj[cb.value] = true;
    });

    const dataToSave = {
        rank: newRank || null, // Если пусто, удаляем из базы (null)
        achievements: achievementsObj
    };

    showLoader();
    try {
        await update(ref(db, `userStats/${uid}`), dataToSave);
        showNotification('Данные пользователя обновлены!');
        userManagerModal.classList.add('hidden');
        // Если админ редактировал себя, обновим его интерфейс сразу
        if (uid === auth.currentUser.uid) {
             // Перезагрузка статей вызовет пересчет статистики
             await fetchArticles(); 
        }
    } catch (e) {
        showNotification('Ошибка сохранения', 'error');
    } finally {
        hideLoader();
    }
});

closeUserManagerBtn.addEventListener('click', () => {
    userManagerModal.classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
    showLoader();
    logoutBtn.addEventListener('click', handleLogout);
    articleForm.addEventListener('submit', handleFormSubmit);
    cancelEditBtn.addEventListener('click', handleCancelEdit);
    cleanupBtn.addEventListener('click', handleCleanup);
    createArticleBtn.addEventListener('click', handleCreateClick);
    
    textTextarea.addEventListener('input', checkTextareaOverflow);
    toggleTextBtn.addEventListener('click', toggleTextareaSize);
    
    sortBySubmissionBtn.classList.toggle('active', currentSortMode === 'submission');
    sortByPublicationBtn.classList.toggle('active', currentSortMode === 'publication');
    sortBySubmissionBtn.addEventListener('click', () => setSortMode('submission'));
    sortByPublicationBtn.addEventListener('click', () => setSortMode('publication'));
});