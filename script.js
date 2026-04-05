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
}

document.addEventListener('DOMContentLoaded', () => {
    const pageName = document.getElementById('note') ? 'index' : 'history';
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
                const newEntry = {
                    id: Date.now(),
                    text: text,
                    savedAt: new Date().toISOString()
                };
                history.push(newEntry);
                if (history.length > 100) {
                    history.shift();
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
