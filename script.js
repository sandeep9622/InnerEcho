function buildMenu(pageName) {
    const sideMenu = document.getElementById('side-menu');
    sideMenu.innerHTML = '';

    const newNoteItem = document.createElement('div');
    newNoteItem.className = 'menu-item' + (pageName === 'index' ? ' active' : '');
    newNoteItem.id = 'new-note-btn';
    newNoteItem.innerHTML = '<span class="icon">📝</span><span class="label">New Note</span>';
    newNoteItem.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    sideMenu.appendChild(newNoteItem);

    const historyItem = document.createElement('div');
    historyItem.className = 'menu-item' + (pageName === 'history' ? ' active' : '');
    historyItem.id = 'history-btn';
    historyItem.innerHTML = '<span class="icon">🕐</span><span class="label">History</span>';
    historyItem.addEventListener('click', () => {
        window.location.href = 'history.html';
    });
    sideMenu.appendChild(historyItem);

    const helpItem = document.createElement('div');
    helpItem.className = 'menu-item' + (pageName === 'help' ? ' active' : '');
    helpItem.id = 'help-btn';
    helpItem.innerHTML = '<span class="icon">❓</span><span class="label">Help</span>';
    helpItem.addEventListener('click', () => {
        window.location.href = 'help.html';
    });
    sideMenu.appendChild(helpItem);

    const aboutItem = document.createElement('div');
    aboutItem.className = 'menu-item' + (pageName === 'about' ? ' active' : '');
    aboutItem.id = 'about-btn';
    aboutItem.innerHTML = '<span class="icon">ℹ️</span><span class="label">About</span>';
    aboutItem.addEventListener('click', () => {
        window.location.href = 'about.html';
    });
    sideMenu.appendChild(aboutItem);
}

document.addEventListener('DOMContentLoaded', () => {
    let pageName = 'index';
    if (document.getElementById('history-container')) {
        pageName = 'history';
    } else if (document.getElementById('about-container')) {
        pageName = 'about';
    } else if (document.getElementById('help-container')) {
        pageName = 'help';
    }
    buildMenu(pageName);

    const menuBtn = document.querySelector('.menu');
    const overlay = document.getElementById('overlay');
    const sideMenu = document.getElementById('side-menu');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');

    // Dark mode
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    }

    darkModeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('dark-mode', isDark);
        darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    });

    if (pageName === 'index') {
        // Index page specific code
        const noteTextarea = document.getElementById('note');

        // Load edit note if any
        const editNote = localStorage.getItem('edit_note');
        const editNoteId = localStorage.getItem('edit_note_id');
        if (editNote) {
            noteTextarea.value = editNote;
            localStorage.removeItem('edit_note');
        }

        noteTextarea.focus();

        let saveTimeout;

        function showSaved() {
            const indicator = document.getElementById('saved-indicator');
            indicator.style.opacity = '1';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 1500);
        }

        // Debounced save to sessionStorage
        noteTextarea.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                sessionStorage.setItem('current_note', noteTextarea.value);
                showSaved();
            }, 500);
        });

        // Save to history on beforeunload
        window.addEventListener('beforeunload', () => {
            const text = noteTextarea.value.trim();
            if (text.length > 10) {
                const history = JSON.parse(localStorage.getItem('notes_history')) || [];
                
                if (editNoteId) {
                    // Update existing note
                    const noteIndex = history.findIndex(note => note.id == editNoteId);
                    if (noteIndex !== -1) {
                        history[noteIndex].text = text;
                        history[noteIndex].savedAt = new Date().toISOString();
                    }
                    localStorage.removeItem('edit_note_id');
                } else {
                    // Create new note
                    const newEntry = {
                        id: Date.now(),
                        text: text,
                        savedAt: new Date().toISOString()
                    };
                    history.push(newEntry);
                }
                localStorage.setItem('notes_history', JSON.stringify(history));
            }
        });
    }

    // Menu functionality (common)
    menuBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    function toggleMenu() {
        const isOpen = sideMenu.classList.contains('active');
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    function openMenu() {
        sideMenu.classList.add('active');
        overlay.classList.add('active');
        menuBtn.textContent = '✕';
    }

    function closeMenu() {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
        menuBtn.textContent = '☰';
    }
});

// ============================================================
// Real-time Note Analysis using Transformers.js
// ============================================================

const NoteAnalyzer = {
    classifier: null,
    isModelLoading: true,
    isAnalyzing: false,
    debounceTimer: null,
    debounceDelay: 2000, // 2 seconds

    // Initialize the model
    async init() {
        try {
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers');
            this.classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            this.isModelLoading = false;
            this.hidePanel();
            console.log('✓ Sentiment analysis model loaded');
        } catch (error) {
            console.error('Failed to load sentiment model:', error);
            this.hidePanel();
        }
    },

    // Extract top keywords using TF-IDF
    extractKeywords(text, topN = 5) {
        if (!text || text.trim().length < 3) return [];

        // Clean and tokenize text
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !this.isStopword(w));

        if (words.length === 0) return [];

        // Calculate TF (Term Frequency)
        const tf = {};
        words.forEach(word => {
            tf[word] = (tf[word] || 0) + 1;
        });

        // Normalize TF
        const totalWords = words.length;
        Object.keys(tf).forEach(word => {
            tf[word] = tf[word] / totalWords;
        });

        // Simple approximation: words that appear less frequently but are present
        // In real TF-IDF, we'd need a corpus for IDF, so we use word frequency
        // and penalize very common words
        const scores = {};
        Object.entries(tf).forEach(([word, freq]) => {
            // Boost rare words, penalize very frequent ones
            scores[word] = freq * Math.log(words.length / (tf[word] * words.length + 1));
        });

        // Get top N keywords
        const keywords = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([word]) => word);

        return keywords;
    },

    // Common English stopwords
    isStopword(word) {
        const stopwords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
            'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
            'as', 'just', 'so', 'than', 'too', 'very', 'no', 'not', 'only',
            'own', 'same', 'so', 'then', 'there', 'up', 'about', 'am',
            'your', 'it\'s', 'don\'t', 'doesn\'t', 'didn\'t', 'it', 'that\'s'
        ]);
        return stopwords.has(word);
    },

    // Analyze note text
    async analyze(text) {
        if (!text || text.trim().length === 0 || !this.classifier || this.isModelLoading) {
            return null;
        }

        this.isAnalyzing = true;
        this.showPanel();
        this.showLoading();

        try {
            // Run sentiment analysis
            const results = await this.classifier(text.substring(0, 512));
            const sentiment = results[0];

            // Extract keywords
            const keywords = this.extractKeywords(text, 5);

            // Determine mood
            const label = sentiment.label.toLowerCase();
            const score = sentiment.score;
            const confidence = Math.round(score * 100);

            let mood = '😐';
            let moodLabel = 'Neutral';
            if (label === 'positive') {
                mood = '😊';
                moodLabel = 'Positive';
            } else if (label === 'negative') {
                mood = '😟';
                moodLabel = 'Negative';
            }

            this.displayResults(mood, moodLabel, confidence, keywords);
        } catch (error) {
            console.error('Analysis error:', error);
            this.hidePanel();
        } finally {
            this.isAnalyzing = false;
        }
    },

    // Display analysis results
    displayResults(mood, label, confidence, keywords) {
        const contentDiv = document.getElementById('panel-content');
        if (!contentDiv) return;

        let html = `
            <div class="sentiment-section">
                <div class="sentiment-mood">
                    <div class="mood-emoji">${mood}</div>
                    <div class="mood-text">
                        <div class="mood-label">${label}</div>
                        <div class="mood-confidence">${confidence}% confident</div>
                    </div>
                </div>
            </div>
        `;

        if (keywords && keywords.length > 0) {
            html += `
                <div class="keywords-section">
                    <div class="keywords-label">Top Keywords</div>
                    <div class="keywords-tags">
                        ${keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        contentDiv.innerHTML = html;
    },

    showLoading() {
        const contentDiv = document.getElementById('panel-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="ai-loading-text">
                    <span class="loading-spinner"></span>
                    <span>Analyzing...</span>
                </div>
            `;
        }
    },

    showPanel() {
        const panel = document.getElementById('ai-analysis-panel');
        if (panel) panel.style.display = 'block';
    },

    hidePanel() {
        const panel = document.getElementById('ai-analysis-panel');
        if (panel) panel.style.display = 'none';
    },

    // Debounced analysis trigger
    triggerAnalysis(text) {
        clearTimeout(this.debounceTimer);
        if (this.isModelLoading || this.isAnalyzing) return;

        this.debounceTimer = setTimeout(() => {
            this.analyze(text);
        }, this.debounceDelay);
    }
};

// Initialize on page load (only on index page)
window.addEventListener('load', () => {
    const textarea = document.getElementById('note');
    if (textarea) {
        NoteAnalyzer.init();

        // Show loading state
        const panel = document.getElementById('ai-analysis-panel');
        if (panel) {
            panel.style.display = 'block';
        }

        // Setup textarea listener
        textarea.addEventListener('input', (e) => {
            NoteAnalyzer.triggerAnalysis(e.target.value);
        });

        // Setup close button
        const closeBtn = document.querySelector('.panel-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                NoteAnalyzer.hidePanel();
            });
        }
    }
});
