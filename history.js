document.addEventListener('DOMContentLoaded', () => {
    const historyContainer = document.getElementById('history-container');

    // Add backup and restore controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'backup-controls';
    controlsDiv.innerHTML = `
        <button id="backup-btn" class="backup-btn">📥 Backup Notes</button>
        <button id="restore-btn" class="restore-btn">📤 Restore Notes</button>
        <input type="file" id="restore-file" accept=".json" style="display: none;">
    `;
    historyContainer.appendChild(controlsDiv);

    // Backup functionality
    document.getElementById('backup-btn').addEventListener('click', () => {
        const history = JSON.parse(localStorage.getItem('notes_history')) || [];
        if (history.length === 0) {
            alert('No notes to backup.');
            return;
        }

        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `inner-echo-notes-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // Restore functionality
    document.getElementById('restore-btn').addEventListener('click', () => {
        document.getElementById('restore-file').click();
    });

    document.getElementById('restore-file').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedNotes = JSON.parse(e.target.result);

                // Validate the imported data structure
                if (!Array.isArray(importedNotes)) {
                    throw new Error('Invalid file format. Expected an array of notes.');
                }

                // Validate each note has required fields
                for (const note of importedNotes) {
                    if (!note.id || !note.text || !note.savedAt) {
                        throw new Error('Invalid note format. Each note must have id, text, and savedAt fields.');
                    }
                }

                // Get existing notes
                const existingNotes = JSON.parse(localStorage.getItem('notes_history')) || [];

                // Merge notes, avoiding duplicates by ID
                const mergedNotes = [...existingNotes];
                let importedCount = 0;

                for (const importedNote of importedNotes) {
                    const existingIndex = mergedNotes.findIndex(note => note.id === importedNote.id);
                    if (existingIndex === -1) {
                        // New note, add it
                        mergedNotes.push(importedNote);
                        importedCount++;
                    } else {
                        // Existing note, ask user if they want to overwrite
                        if (confirm(`Note with ID ${importedNote.id} already exists. Overwrite it?`)) {
                            mergedNotes[existingIndex] = importedNote;
                            importedCount++;
                        }
                    }
                }

                // Save merged notes
                localStorage.setItem('notes_history', JSON.stringify(mergedNotes));

                alert(`Successfully imported ${importedCount} note(s). Page will reload to show changes.`);
                location.reload();

            } catch (error) {
                alert('Error importing notes: ' + error.message);
            }
        };
        reader.readAsText(file);
    });

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
            localStorage.setItem('edit_note_id', note.id);
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