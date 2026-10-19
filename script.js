/* =========================================================
 *  治愈系背单词 - 核心脚本（终极版）
 *  功能：
 *    - 多词库管理与自定义上传
 *    - 3D 翻转卡片与语音发音
 *    - 艾宾浩斯复习队列
 *    - 拼写测试模式
 *    - 错题本（生词本）
 *    - 连击（Combo）与音效反馈
 *    - 日历打卡热力图
 *    - 终极奖励结算页面
 * ========================================================= */

// ================= 1. 内置词库数据 =================
const BUILTIN_LIBRARIES = {
    grade8: {
        name: '初二词库',
        words: [
            { word: 'adventure', phonetic: '/ədˈventʃər/', meaning: '冒险；奇遇' },
            { word: 'ancient', phonetic: '/ˈeɪnʃənt/', meaning: '古老的；古代的' },
            { word: 'believe', phonetic: '/bɪˈliːv/', meaning: '相信；认为' },
            { word: 'celebrate', phonetic: '/ˈselɪbreɪt/', meaning: '庆祝；庆贺' },
            { word: 'curious', phonetic: '/ˈkjʊəriəs/', meaning: '好奇的；求知欲强的' },
            { word: 'discover', phonetic: '/dɪˈskʌvər/', meaning: '发现；发觉' },
            { word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', meaning: '环境；周围的事物' },
            { word: 'imagine', phonetic: '/ɪˈmædʒɪn/', meaning: '想象；设想' },
            { word: 'journey', phonetic: '/ˈdʒɜːrni/', meaning: '旅行；旅程' },
            { word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/', meaning: '知识；学问' }
        ]
    },
    cet4: {
        name: '四级词库',
        words: [
            { word: 'abundant', phonetic: '/əˈbʌndənt/', meaning: '丰富的；充裕的' },
            { word: 'beneficial', phonetic: '/ˌbenɪˈfɪʃl/', meaning: '有益的；有利的' },
            { word: 'complicated', phonetic: '/ˈkɒmplɪkeɪtɪd/', meaning: '复杂的；难懂的' },
            { word: 'demonstrate', phonetic: '/ˈdemənstreɪt/', meaning: '证明；演示' },
            { word: 'enthusiasm', phonetic: '/ɪnˈθjuːziæzəm/', meaning: '热情；热忱' },
            { word: 'fundamental', phonetic: '/ˌfʌndəˈmentl/', meaning: '基本的；根本的' },
            { word: 'inevitable', phonetic: '/ɪnˈevɪtəbl/', meaning: '不可避免的' },
            { word: 'magnificent', phonetic: '/mæɡˈnɪfɪsnt/', meaning: '壮丽的；极好的' },
            { word: 'perspective', phonetic: '/pəˈspektɪv/', meaning: '观点；视角；前景' },
            { word: 'sophisticated', phonetic: '/səˈfɪstɪkeɪtɪd/', meaning: '精密的；老练的' }
        ]
    }
};

// ================= 2. 状态管理 =================
const STORAGE_KEYS = {
    CUSTOM_LIBS: 'healing_vocab_custom_libraries',
    DAILY_STATS: 'healing_vocab_daily_stats',
    REVIEW_QUEUE: 'healing_vocab_review_queue',
    TOTAL_LEARNED: 'healing_vocab_total_learned',
    WRONG_BOOK: 'healing_vocab_wrong_book'
};

const appState = {
    mode: 'study',
    currentLibraryKey: 'builtin:grade8',
    currentWords: [],
    queue: [],
    queueIndex: 0,
    isTransitioning: false,
    pendingAction: null,
    spellingWords: [],
    spellingIndex: 0,
    spellingCorrect: 0,
    spellingTotal: 0,
    combo: 0,
    // 新增：记录本轮最高连击数
    maxCombo: 0
};

// 新增：奖励文案库（随机抽取一句展示）
const REWARD_QUOTES = [
    '你走过的路，每一步都算数。',
    '今天的你，比昨天更闪耀。',
    '坚持的意义，时间会给你答案。',
    '每一次努力，都是未来的礼物。',
    '星光不问赶路人，时光不负有心人。',
    '慢慢来，比较快。',
    '你比自己想象的更强大。',
    '种一棵树最好的时间是十年前，其次是现在。',
    '所有的光鲜亮丽，背后都是咬牙坚持。',
    '愿你成为自己的太阳，无需凭借谁的光。'
];

// ---------- localStorage 读写函数 ----------

function loadCustomLibraries() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_LIBS)) || {};
    } catch {
        return {};
    }
}

function saveCustomLibraries(libs) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LIBS, JSON.stringify(libs));
}

function loadDailyStats() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_STATS)) || {};
    } catch {
        return {};
    }
}

function saveDailyStats(stats) {
    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
}

function loadReviewQueue() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEW_QUEUE)) || [];
    } catch {
        return [];
    }
}

function saveReviewQueue(queue) {
    localStorage.setItem(STORAGE_KEYS.REVIEW_QUEUE, JSON.stringify(queue));
}

function loadTotalLearned() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_LEARNED) || '0', 10);
}

function saveTotalLearned(n) {
    localStorage.setItem(STORAGE_KEYS.TOTAL_LEARNED, String(n));
}

function loadWrongBook() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.WRONG_BOOK)) || [];
    } catch {
        return [];
    }
}

function saveWrongBook(book) {
    localStorage.setItem(STORAGE_KEYS.WRONG_BOOK, JSON.stringify(book));
}

// ================= 3. 工具函数 =================

function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getTodayStats() {
    const stats = loadDailyStats();
    const key = getTodayKey();
    if (!stats[key]) {
        stats[key] = { learned: 0, spellingCorrect: 0, spellingTotal: 0 };
        saveDailyStats(stats);
    }
    return stats[key];
}

function incrementTodayLearned() {
    const stats = loadDailyStats();
    const key = getTodayKey();
    if (!stats[key]) stats[key] = { learned: 0, spellingCorrect: 0, spellingTotal: 0 };
    stats[key].learned += 1;
    saveDailyStats(stats);
    saveTotalLearned(loadTotalLearned() + 1);
}

function recordSpellingResult(correct, total) {
    const stats = loadDailyStats();
    const key = getTodayKey();
    if (!stats[key]) stats[key] = { learned: 0, spellingCorrect: 0, spellingTotal: 0 };
    stats[key].spellingCorrect += correct;
    stats[key].spellingTotal += total;
    saveDailyStats(stats);
}

function computeTotalLearned() {
    const stats = loadDailyStats();
    let total = 0;
    for (const key in stats) {
        total += (stats[key].learned || 0);
    }
    return total;
}

function speakWord(word) {
    if (!('speechSynthesis' in window)) {
        alert('您的浏览器不支持语音合成功能哦');
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getWordsByLibraryKey(key) {
    if (key.startsWith('builtin:')) {
        const libName = key.slice('builtin:'.length);
        return BUILTIN_LIBRARIES[libName] ? BUILTIN_LIBRARIES[libName].words : [];
    } else {
        const libs = loadCustomLibraries();
        // 自定义词库的 key 格式为 "custom:名称"，需要去掉前缀
        const actualName = key.startsWith('custom:') ? key.slice('custom:'.length) : key;
        return libs[actualName] || [];
    }
}

function getLibraryName(key) {
    if (key.startsWith('builtin:')) {
        const libName = key.slice('builtin:'.length);
        return BUILTIN_LIBRARIES[libName] ? BUILTIN_LIBRARIES[libName].name : '';
    }
    return key.startsWith('custom:') ? key.slice('custom:'.length) : key;
}

// ================= 4. 视图渲染 =================

const dom = {
    dateText: document.getElementById('date-text'),
    todayCount: document.getElementById('today-count'),
    totalCount: document.getElementById('total-count'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    librarySelect: document.getElementById('library-select'),
    customOptgroup: document.getElementById('custom-optgroup'),
    reviewBtn: document.getElementById('review-btn'),
    reviewCount: document.getElementById('review-count'),
    wrongBookBtn: document.getElementById('wrong-book-btn'),
    wrongBookCount: document.getElementById('wrong-book-count'),
    modeTag: document.getElementById('mode-tag'),
    comboArea: document.getElementById('combo-area'),
    comboCounter: document.getElementById('combo-counter'),
    cardArea: document.getElementById('card-area'),
    flashcard: document.getElementById('flashcard'),
    wordText: document.getElementById('word-text'),
    phoneticText: document.getElementById('phonetic-text'),
    meaningText: document.getElementById('meaning-text'),
    viewMeaningBtn: document.getElementById('view-meaning-btn'),
    spellingArea: document.getElementById('spelling-area'),
    spellingMeaning: document.getElementById('spelling-meaning'),
    spellingInput: document.getElementById('spelling-input'),
    spellingFeedback: document.getElementById('spelling-feedback'),
    spellingProgress: document.getElementById('spelling-progress'),
    emptyState: document.getElementById('empty-state'),
    heatmapGrid: document.getElementById('heatmap-grid'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    sidebar: document.getElementById('sidebar'),
    sidebarContent: document.getElementById('sidebar-content'),
    sidebarEmpty: document.getElementById('sidebar-empty'),
    modalDone: document.getElementById('modal-done'),
    modalSpellingResult: document.getElementById('modal-spelling-result'),
    modalNaming: document.getElementById('modal-naming'),
    namingInput: document.getElementById('naming-input'),
    spellingResultIcon: document.getElementById('spelling-result-icon'),
    spellingResultTitle: document.getElementById('spelling-result-title'),
    spellingResultText: document.getElementById('spelling-result-text'),
    // 新增：终极奖励相关 DOM
    rewardOverlay: document.getElementById('reward-overlay'),
    rewardParticles: document.getElementById('reward-particles'),
    rewardQuote: document.getElementById('reward-quote'),
    rewardLearned: document.getElementById('reward-learned'),
    rewardMaxCombo: document.getElementById('reward-max-combo')
};

function renderStats() {
    dom.dateText.textContent = getTodayKey();
    const todayStats = getTodayStats();
    dom.todayCount.textContent = todayStats.learned;
    dom.totalCount.textContent = computeTotalLearned();

    const total = appState.currentWords.length;
    const done = appState.queueIndex;
    const percent = total > 0 ? (done / total) * 100 : 0;
    dom.progressFill.style.width = `${percent}%`;
    dom.progressText.textContent = `${done} / ${total}`;
}

function renderLibrarySelect() {
    dom.customOptgroup.innerHTML = '';
    const libs = loadCustomLibraries();
    for (const name in libs) {
        const option = document.createElement('option');
        option.value = `custom:${name}`;
        option.textContent = name;
        dom.customOptgroup.appendChild(option);
    }
    dom.librarySelect.value = appState.currentLibraryKey;
}

function renderReviewButton() {
    const queue = loadReviewQueue();
    dom.reviewCount.textContent = queue.length;
    dom.reviewBtn.disabled = queue.length === 0;
}

function renderWrongBookButton() {
    const book = loadWrongBook();
    dom.wrongBookCount.textContent = book.length;
}

function renderModeTag() {
    const map = {
        study: '📖 学习模式',
        review: '🔁 复习模式',
        spelling: '✍️ 拼写模式'
    };
    dom.modeTag.textContent = map[appState.mode] || '';
}

function renderCard() {
    const item = appState.queue[appState.queueIndex];
    if (!item) {
        dom.cardArea.classList.add('hidden');
        dom.emptyState.classList.remove('hidden');
        return;
    }
    dom.emptyState.classList.add('hidden');
    dom.cardArea.classList.remove('hidden');
    dom.wordText.textContent = item.word;
    dom.phoneticText.textContent = item.phonetic || '';
    dom.meaningText.textContent = item.meaning;
    dom.flashcard.classList.remove('flipped');
}

function renderSpelling() {
    const item = appState.spellingWords[appState.spellingIndex];
    if (!item) return;
    dom.spellingMeaning.textContent = item.meaning;
    dom.spellingInput.value = '';
    dom.spellingFeedback.textContent = '';
    dom.spellingFeedback.className = 'spelling-feedback';
    dom.spellingProgress.textContent = `${appState.spellingIndex + 1} / ${appState.spellingWords.length}`;
    dom.spellingInput.focus();
}

function switchModeUI() {
    if (appState.mode === 'spelling') {
        dom.cardArea.classList.add('hidden');
        dom.spellingArea.classList.remove('hidden');
        dom.viewMeaningBtn.classList.add('hidden');
    } else {
        dom.spellingArea.classList.add('hidden');
        dom.cardArea.classList.remove('hidden');
        dom.viewMeaningBtn.classList.remove('hidden');
    }
    renderModeTag();
}

function renderHeatmap() {
    dom.heatmapGrid.innerHTML = '';
    const stats = loadDailyStats();
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;
        
        const learned = stats[dateKey]?.learned || 0;
        const isActive = learned > 0;
        
        const cell = document.createElement('div');
        cell.className = `heatmap-cell${isActive ? ' active' : ''}`;
        cell.dataset.tooltip = isActive ? `已背 ${learned} 词` : '未学习';
        
        cell.innerHTML = `
            <div class="cell-date">${m}/${d}</div>
            ${isActive ? `<div class="cell-count">${learned}</div>` : ''}
        `;
        
        dom.heatmapGrid.appendChild(cell);
    }
}

function renderWrongBookSidebar() {
    const book = loadWrongBook();
    
    if (book.length === 0) {
        dom.sidebarContent.classList.add('hidden');
        dom.sidebarEmpty.classList.remove('hidden');
        return;
    }
    
    dom.sidebarContent.classList.remove('hidden');
    dom.sidebarEmpty.classList.add('hidden');
    dom.sidebarContent.innerHTML = '';
    
    book.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'wrong-item';
        div.innerHTML = `
            <div class="wrong-item-info">
                <div class="wrong-item-word">${item.word}</div>
                <div class="wrong-item-meaning">${item.meaning}</div>
            </div>
            <button class="wrong-item-remove" data-index="${index}">已掌握</button>
        `;
        dom.sidebarContent.appendChild(div);
    });
    
    dom.sidebarContent.querySelectorAll('.wrong-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            removeFromWrongBook(index);
        });
    });
}

// ================= 5. 学习模式逻辑 =================

function enterStudyMode(libraryKey) {
    appState.mode = 'study';
    appState.currentLibraryKey = libraryKey;
    appState.currentWords = getWordsByLibraryKey(libraryKey);
    appState.queue = shuffle(appState.currentWords);
    appState.queueIndex = 0;
    appState.isTransitioning = false;
    switchModeUI();
    renderCard();
    renderStats();
    renderReviewButton();
}

function handleAnswer(action) {
    if (appState.isTransitioning) return;
    const item = appState.queue[appState.queueIndex];
    if (!item) return;
    appState.isTransitioning = true;

    // Combo 逻辑
    if (action === 'known') {
        appState.combo += 1;
        // 更新最高连击记录
        if (appState.combo > appState.maxCombo) {
            appState.maxCombo = appState.combo;
        }
        checkComboEffect();
    } else {
        appState.combo = 0;
    }

    if (appState.mode === 'review') {
        if (action === 'known') {
            removeFromReviewQueue(item);
        }
    } else if (appState.mode === 'study') {
        if (action === 'unknown') {
            addToReviewQueue(item);
            addToWrongBook(item);
        }
        incrementTodayLearned();
    }

    dom.flashcard.classList.add('flipped');

    setTimeout(() => {
        appState.queueIndex += 1;
        appState.isTransitioning = false;

        if (appState.queueIndex >= appState.queue.length) {
            renderStats();
            renderReviewButton();
            renderHeatmap();
            if (appState.mode === 'study') {
                showModal(dom.modalDone);
            } else if (appState.mode === 'review') {
                // 复习队列清零 → 触发终极奖励
                showRewardOverlay();
            }
        } else {
            renderCard();
            renderStats();
            renderReviewButton();
        }
    }, 2000);
}

// ================= 6. 复习队列管理 =================

function addToReviewQueue(item) {
    const queue = loadReviewQueue();
    const exists = queue.some(q => q.word === item.word && q.libraryKey === appState.currentLibraryKey);
    if (!exists) {
        queue.push({
            word: item.word,
            phonetic: item.phonetic,
            meaning: item.meaning,
            libraryKey: appState.currentLibraryKey
        });
        saveReviewQueue(queue);
    }
}

function removeFromReviewQueue(item) {
    let queue = loadReviewQueue();
    queue = queue.filter(q => !(q.word === item.word && q.libraryKey === (item.libraryKey || appState.currentLibraryKey)));
    saveReviewQueue(queue);
}

function enterReviewMode() {
    const queue = loadReviewQueue();
    if (queue.length === 0) {
        alert('暂无待复习词汇，真棒！');
        return;
    }
    appState.mode = 'review';
    appState.queue = shuffle(queue);
    appState.queueIndex = 0;
    appState.isTransitioning = false;
    switchModeUI();
    renderCard();
    renderStats();
}

// ================= 7. 拼写模式逻辑 =================

function enterSpellingMode() {
    const words = getWordsByLibraryKey(appState.currentLibraryKey);
    if (words.length === 0) {
        alert('当前词库为空，无法开始拼写');
        return;
    }
    appState.mode = 'spelling';
    appState.spellingWords = shuffle(words);
    appState.spellingIndex = 0;
    appState.spellingCorrect = 0;
    appState.spellingTotal = words.length;
    switchModeUI();
    renderSpelling();
    renderStats();
}

function submitSpelling() {
    const item = appState.spellingWords[appState.spellingIndex];
    if (!item) return;
    const input = dom.spellingInput.value.trim().toLowerCase();
    const answer = item.word.toLowerCase();

    if (input === answer) {
        dom.spellingFeedback.textContent = '✓ 正确！';
        dom.spellingFeedback.className = 'spelling-feedback correct';
        appState.spellingCorrect += 1;
        appState.combo += 1;
        if (appState.combo > appState.maxCombo) {
            appState.maxCombo = appState.combo;
        }
        checkComboEffect();
    } else {
        dom.spellingFeedback.textContent = `✗ 正确拼写：${item.word}`;
        dom.spellingFeedback.className = 'spelling-feedback wrong';
        appState.combo = 0;
        addToWrongBook(item);
    }

    dom.spellingInput.disabled = true;

    setTimeout(() => {
        appState.spellingIndex += 1;
        dom.spellingInput.disabled = false;

        if (appState.spellingIndex >= appState.spellingWords.length) {
            recordSpellingResult(appState.spellingCorrect, appState.spellingTotal);
            // 拼写完成 → 触发终极奖励（替代原来的 showSpellingResult）
            showRewardOverlay();
        } else {
            renderSpelling();
            renderStats();
        }
    }, 1500);
}

// ================= 8. 自定义词库上传 =================

let pendingFileContent = null;

function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        pendingFileContent = e.target.result;
        dom.namingInput.value = file.name.replace(/\.txt$/i, '');
        showModal(dom.modalNaming);
        setTimeout(() => dom.namingInput.focus(), 100);
    };
    reader.readAsText(file, 'UTF-8');
}

function parseTxtContent(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const words = [];
    for (const line of lines) {
        const match = line.match(/^([A-Za-z\-'\s]+?)[\s\t\-—]+(.+)$/);
        if (match) {
            words.push({
                word: match[1].trim(),
                phonetic: '',
                meaning: match[2].trim()
            });
        }
    }
    return words;
}

function confirmSaveLibrary() {
    const name = dom.namingInput.value.trim();
    if (!name) {
        alert('请输入词库名称');
        return;
    }
    if (!pendingFileContent) return;

    const words = parseTxtContent(pendingFileContent);
    if (words.length === 0) {
        alert('未解析到有效单词，请检查文件格式（每行：英文 中文）');
        return;
    }

    const libs = loadCustomLibraries();
    libs[name] = words;
    saveCustomLibraries(libs);

    const newKey = `custom:${name}`;
    renderLibrarySelect();
    enterStudyMode(newKey);

    hideModal(dom.modalNaming);
    pendingFileContent = null;
}

// ================= 9. 弹窗工具 =================

function showModal(modalEl) {
    modalEl.classList.add('active');
}

function hideModal(modalEl) {
    modalEl.classList.remove('active');
}

// ================= 10. 错题本功能 =================

function addToWrongBook(item) {
    const book = loadWrongBook();
    const exists = book.some(b => b.word === item.word);
    if (!exists) {
        book.push({
            word: item.word,
            phonetic: item.phonetic || '',
            meaning: item.meaning,
            libraryKey: appState.currentLibraryKey,
            addedAt: getTodayKey()
        });
        saveWrongBook(book);
        renderWrongBookButton();
    }
}

function removeFromWrongBook(index) {
    const book = loadWrongBook();
    book.splice(index, 1);
    saveWrongBook(book);
    renderWrongBookButton();
    renderWrongBookSidebar();
}

function openWrongBookSidebar() {
    renderWrongBookSidebar();
    dom.sidebarOverlay.classList.add('active');
}

function closeWrongBookSidebar() {
    dom.sidebarOverlay.classList.remove('active');
}

// ================= 11. Combo 与音效 =================

function checkComboEffect() {
    const combo = appState.combo;
    
    if (combo === 3 || combo === 5 || combo === 10 || (combo > 10 && combo % 10 === 0)) {
        showComboEffect(combo);
        playComboSound(combo);
    }
}

function showComboEffect(combo) {
    dom.comboCounter.textContent = `🔥 Combo x${combo}!`;
    dom.comboCounter.classList.remove('show');
    void dom.comboCounter.offsetWidth;
    dom.comboCounter.classList.add('show');
    
    setTimeout(() => {
        dom.comboCounter.classList.remove('show');
    }, 1500);
}

function playComboSound(combo) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const baseFreq = combo >= 10 ? 880 : combo >= 5 ? 660 : 523;
        oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.warn('音频播放失败:', e);
    }
}

// ================= 12. 新增：终极奖励结算页面 =================

/**
 * 显示终极奖励遮罩层
 * 触发条件：
 *   - 学习模式完成 + 拼写完成
 *   - 复习队列清零
 */
function showRewardOverlay() {
    // 1. 填充战报数据
    const todayStats = getTodayStats();
    dom.rewardLearned.textContent = todayStats.learned;
    dom.rewardMaxCombo.textContent = appState.maxCombo;
    
    // 2. 随机抽取一句奖励文案
    const randomIndex = Math.floor(Math.random() * REWARD_QUOTES.length);
    dom.rewardQuote.textContent = REWARD_QUOTES[randomIndex];
    
    // 3. 生成撒花粒子动画
    createRewardParticles();
    
    // 4. 播放一段胜利音效
    playRewardSound();
    
    // 5. 显示遮罩层
    dom.rewardOverlay.classList.add('active');
}

/**
 * 生成纯 CSS 撒花/星光粒子
 * 在 reward-particles 容器中动态创建多个小圆点，
 * 每个粒子具有随机的位置、大小、颜色、下落时长和延迟
 */
function createRewardParticles() {
    dom.rewardParticles.innerHTML = '';
    
    // 粒子颜色池（温暖的金色系 + 莫兰迪绿系，契合治愈主题）
    const colors = [
        'radial-gradient(circle, #FFD700 0%, #FFA500 100%)',
        'radial-gradient(circle, #A3B19B 0%, #8FA884 100%)',
        'radial-gradient(circle, #F4D5D5 0%, #E8B4B4 100%)',
        'radial-gradient(circle, #E8D5C4 0%, #D4A373 100%)',
        'radial-gradient(circle, #C5D5C5 0%, #A3B19B 100%)'
    ];
    
    // 生成 40 个粒子
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'reward-particle';
        
        // 随机属性
        const size = Math.random() * 10 + 4;           // 4-14px
        const left = Math.random() * 100;              // 0-100%
        const duration = Math.random() * 3 + 2;        // 2-5 秒
        const delay = Math.random() * 2;               // 0-2 秒延迟
        const colorIndex = Math.floor(Math.random() * colors.length);
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.top = `-20px`;
        particle.style.background = colors[colorIndex];
        particle.style.boxShadow = `0 0 ${size}px rgba(255, 215, 0, 0.4)`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        dom.rewardParticles.appendChild(particle);
    }
}

/**
 * 播放奖励胜利音效（使用 Web Audio API 合成一段轻快的上行音阶）
 */
function playRewardSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 三个音符依次播放，形成"叮-叮-叮～"的上行旋律
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const startTime = audioContext.currentTime + index * 0.15;
            oscillator.frequency.setValueAtTime(freq, startTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
    } catch (e) {
        console.warn('奖励音效播放失败:', e);
    }
}

/**
 * 收下奖励并休息：
 *   - 关闭奖励遮罩层
 *   - 清理粒子动画
 *   - 重置 combo 和 maxCombo
 *   - 重新进入学习模式（词库从头开始）
 *   - 刷新热力图和统计
 */
function claimReward() {
    dom.rewardOverlay.classList.remove('active');
    dom.rewardParticles.innerHTML = '';
    
    // 重置连击数据
    appState.combo = 0;
    appState.maxCombo = 0;
    
    // 刷新热力图和统计
    renderHeatmap();
    renderStats();
    
    // 重新进入学习模式
    enterStudyMode(appState.currentLibraryKey);
}

// ================= 13. 事件绑定 =================

dom.librarySelect.addEventListener('change', (e) => {
    enterStudyMode(e.target.value);
});

document.getElementById('file-input').addEventListener('change', (e) => {
    handleFileUpload(e.target.files[0]);
    e.target.value = '';
});

dom.reviewBtn.addEventListener('click', () => {
    enterReviewMode();
});

dom.wrongBookBtn.addEventListener('click', openWrongBookSidebar);
document.getElementById('sidebar-close').addEventListener('click', closeWrongBookSidebar);
dom.sidebarOverlay.addEventListener('click', (e) => {
    if (e.target === dom.sidebarOverlay) closeWrongBookSidebar();
});

document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAnswer(btn.dataset.action);
    });
});

document.getElementById('speak-btn-front').addEventListener('click', (e) => {
    e.stopPropagation();
    const item = appState.queue[appState.queueIndex];
    if (item) speakWord(item.word);
});
document.getElementById('speak-btn-back').addEventListener('click', (e) => {
    e.stopPropagation();
    const item = appState.queue[appState.queueIndex];
    if (item) speakWord(item.word);
});

dom.viewMeaningBtn.addEventListener('click', () => {
    if (appState.isTransitioning) return;
    dom.flashcard.classList.toggle('flipped');
});

document.getElementById('spelling-submit').addEventListener('click', submitSpelling);
dom.spellingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitSpelling();
});

// 弹窗：进入拼写 / 关闭
document.getElementById('btn-go-spelling').addEventListener('click', () => {
    hideModal(dom.modalDone);
    enterSpellingMode();
});
document.getElementById('btn-close-done').addEventListener('click', () => {
    hideModal(dom.modalDone);
    enterStudyMode(appState.currentLibraryKey);
});

// 注意：拼写结果弹窗不再单独使用，由终极奖励替代
// 但保留关闭逻辑以防万一
document.getElementById('btn-close-spelling').addEventListener('click', () => {
    hideModal(dom.modalSpellingResult);
    enterStudyMode(appState.currentLibraryKey);
});

document.getElementById('btn-confirm-name').addEventListener('click', confirmSaveLibrary);
document.getElementById('btn-cancel-name').addEventListener('click', () => {
    hideModal(dom.modalNaming);
    pendingFileContent = null;
});
dom.namingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmSaveLibrary();
});

// 新增：终极奖励 - 收下奖励按钮
document.getElementById('btn-claim-reward').addEventListener('click', claimReward);

// ================= 14. 初始化 =================
function init() {
    renderLibrarySelect();
    enterStudyMode('builtin:grade8');
    renderReviewButton();
    renderWrongBookButton();
    renderHeatmap();
}

init();