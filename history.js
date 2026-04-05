document.addEventListener('DOMContentLoaded', () => {
    const historyContainer = document.getElementById('history-container');

    function timeAgo(isoTimestamp) {
        const now = new Date();
        const past = new Date(isoTimestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
            if (diffMins < 60) {
                return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else {
                return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            }
        } else {
            return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    const history = JSON.parse(localStorage.getItem('notes_history')) || [];
    history.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    if (history.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No notes yet. Start writing.';
        historyContainer.appendChild(emptyMsg);
        return;
    }

    history.forEach(note => {
        const noteRow = document.createElement('div');
        noteRow.className = 'note-row';
        noteRow.style.cursor = 'pointer';
        noteRow.addEventListener('click', () => {
            localStorage.setItem('edit_note', note.text);
            window.location.href = 'index.html';
        });

        const isDesktop = window.innerWidth >= 768;

        if (isDesktop) {
            // Desktop layout
            const noteDate = document.createElement('div');
            noteDate.className = 'note-date';
            const date = new Date(note.savedAt);
            const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            noteDate.innerHTML = `${dateStr} ${timeStr}<br><small style="color: var(--time-tag-color); font-size: 0.8rem;">${timeAgo(note.savedAt)}</small>`;

            const noteBody = document.createElement('div');
            noteBody.className = 'note-body';

            const previewText = note.text.length > 120 ? note.text.substring(0, 120) + '...' : note.text;
            const previewSpan = document.createElement('span');
            previewSpan.textContent = previewText;
            if (note.text.length > 120) {
                const readMore = document.createElement('span');
                readMore.className = 'note-preview';
                readMore.textContent = ' read more';
                readMore.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (readMore.textContent === ' read more') {
                        previewSpan.textContent = note.text;
                        readMore.textContent = ' show less';
                    } else {
                        previewSpan.textContent = previewText;
                        readMore.textContent = ' read more';
                    }
                });
                noteBody.appendChild(previewSpan);
                noteBody.appendChild(readMore);
            } else {
                noteBody.appendChild(previewSpan);
            }

            noteRow.appendChild(noteDate);
            noteRow.appendChild(noteBody);
        } else {
            // Mobile layout
            const noteBody = document.createElement('div');
            noteBody.className = 'note-body';

            const previewText = note.text.length > 100 ? note.text.substring(0, 100) + '...' : note.text;
            const previewSpan = document.createElement('span');
            previewSpan.textContent = previewText;
            if (note.text.length > 100) {
                const readMore = document.createElement('span');
                readMore.className = 'note-preview';
                readMore.textContent = ' read more';
                readMore.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (readMore.textContent === ' read more') {
                        previewSpan.textContent = note.text;
                        readMore.textContent = ' show less';
                    } else {
                        previewSpan.textContent = previewText;
                        readMore.textContent = ' read more';
                    }
                });
                noteBody.appendChild(previewSpan);
                noteBody.appendChild(readMore);
            } else {
                noteBody.appendChild(previewSpan);
            }

            const timeTag = document.createElement('div');
            timeTag.className = 'time-tag';
            timeTag.textContent = timeAgo(note.savedAt);

            noteRow.appendChild(noteBody);
            noteRow.appendChild(timeTag);
        }

        historyContainer.appendChild(noteRow);
    });
});