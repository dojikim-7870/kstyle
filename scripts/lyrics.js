/**
 * K-pop Lyrics Interactive Learning System
 * Displays lyrics with translations, vocabulary, and cultural notes
 */

class LyricsPlayer {
    constructor() {
        this.songs = [];
        this.currentSong = null;
        this.currentLineIndex = 0;
        this.isPlaying = false;
        this.autoAdvance = false;
        this.playbackSpeed = 3000; // ms between lines
        this.timer = null;
        this.vocabulary = new Map();
        
        this.init();
    }
    
    async init() {
        await this.loadSongs();
        this.setupEventListeners();
        this.displaySongList();
    }
    
    async loadSongs() {
        try {
            const response = await fetch('/data/lyrics.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.songs = data.songs || [];
            
            // Build vocabulary index
            this.buildVocabularyIndex();
            
            console.log(`Loaded ${this.songs.length} K-pop songs`);
        } catch (error) {
            console.error('Error loading lyrics:', error);
            this.handleError(error);
        }
    }
    
    buildVocabularyIndex() {
        this.songs.forEach(song => {
            if (song.vocabulary) {
                song.vocabulary.forEach(item => {
                    this.vocabulary.set(item.word.toLowerCase(), item);
                });
            }
        });
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.song-card')) {
                const songId = e.target.dataset.songId;
                this.selectSong(songId);
            }
            
            if (e.target.matches('.play-btn')) {
                this.togglePlayback();
            }
            
            if (e.target.matches('.prev-line-btn')) {
                this.previousLine();
            }
            
            if (e.target.matches('.next-line-btn')) {
                this.nextLine();
            }
            
            if (e.target.matches('.auto-advance-toggle')) {
                this.toggleAutoAdvance();
            }
            
            if (e.target.matches('.speed-control')) {
                this.changeSpeed(e.target.value);
            }
            
            if (e.target.matches('.back-to-songs-btn')) {
                this.displaySongList();
            }
            
            if (e.target.matches('.lyric-line')) {
                const lineIndex = parseInt(e.target.dataset.lineIndex);
                this.goToLine(lineIndex);
            }
            
            if (e.target.matches('.vocab-word')) {
                this.showVocabularyPopup(e.target.textContent, e.target);
            }
            
            if (e.target.matches('.difficulty-filter')) {
                this.filterByDifficulty(e.target.dataset.difficulty);
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.currentSong) return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlayback();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousLine();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextLine();
                    break;
                case 'Escape':
                    this.displaySongList();
                    break;
                case 'a':
                case 'A':
                    this.toggleAutoAdvance();
                    break;
            }
        });
        
        // Handle URL hash for direct song access
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
        
        // Initial hash check
        this.handleHashChange();
    }
    
    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const song = this.songs.find(s => s.id === hash);
            if (song) {
                this.selectSong(hash);
            }
        }
    }
    
    displaySongList() {
        const container = document.getElementById('lyrics-container');
        if (!container) return;
        
        this.currentSong = null;
        this.stopPlayback();
        window.location.hash = '';
        
        // Group songs by difficulty
        const songsByDifficulty = this.songs.reduce((acc, song) => {
            const difficulty = song.difficulty || 'intermediate';
            if (!acc[difficulty]) acc[difficulty] = [];
            acc[difficulty].push(song);
            return acc;
        }, {});
        
        container.innerHTML = `
            <div class="lyrics-home">
                <div class="lyrics-header">
                    <h2>K-pop Lyrics Learning</h2>
                    <p>Learn Korean through your favorite K-pop songs with interactive lyrics, translations, and vocabulary</p>
                </div>
                
                <div class="difficulty-filters">
                    <h3>Filter by Difficulty</h3>
                    <div class="filter-buttons">
                        <button class="btn btn-outline difficulty-filter active" data-difficulty="all">All Songs</button>
                        <button class="btn btn-outline difficulty-filter" data-difficulty="beginner">Beginner</button>
                        <button class="btn btn-outline difficulty-filter" data-difficulty="intermediate">Intermediate</button>
                        <button class="btn btn-outline difficulty-filter" data-difficulty="advanced">Advanced</button>
                    </div>
                </div>
                
                <div class="songs-grid">
                    ${this.songs.map(song => `
                        <div class="song-card" data-song-id="${song.id}">
                            <div class="song-info">
                                <h3 class="song-title">${this.escapeHtml(song.title)}</h3>
                                <p class="song-artist">${this.escapeHtml(song.artist)}</p>
                                <p class="song-album">${this.escapeHtml(song.album)} (${song.year})</p>
                                <span class="difficulty-badge difficulty-${song.difficulty || 'intermediate'}">
                                    ${(song.difficulty || 'intermediate').charAt(0).toUpperCase() + (song.difficulty || 'intermediate').slice(1)}
                                </span>
                            </div>
                            <p class="song-description">${this.escapeHtml(song.description)}</p>
                            <div class="song-stats">
                                <span class="stat">📝 ${song.lyrics.length} lines</span>
                                <span class="stat">📚 ${song.vocabulary ? song.vocabulary.length : 0} vocab words</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    filterByDifficulty(difficulty) {
        // Update active filter button
        document.querySelectorAll('.difficulty-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
        
        // Filter song cards
        const songCards = document.querySelectorAll('.song-card');
        songCards.forEach(card => {
            const songId = card.dataset.songId;
            const song = this.songs.find(s => s.id === songId);
            const songDifficulty = song.difficulty || 'intermediate';
            
            if (difficulty === 'all' || songDifficulty === difficulty) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    selectSong(songId) {
        const song = this.songs.find(s => s.id === songId);
        if (!song) return;
        
        this.currentSong = song;
        this.currentLineIndex = 0;
        this.stopPlayback();
        window.location.hash = songId;
        
        this.displayLyricsPlayer();
    }
    
    displayLyricsPlayer() {
        const container = document.getElementById('lyrics-container');
        if (!container || !this.currentSong) return;
        
        container.innerHTML = `
            <div class="lyrics-player">
                <div class="song-header">
                    <button class="btn btn-outline back-to-songs-btn">← Back to Songs</button>
                    <div class="song-title-info">
                        <h2>${this.escapeHtml(this.currentSong.title)}</h2>
                        <p class="artist-info">by ${this.escapeHtml(this.currentSong.artist)}</p>
                        <span class="difficulty-badge difficulty-${this.currentSong.difficulty || 'intermediate'}">
                            ${(this.currentSong.difficulty || 'intermediate').charAt(0).toUpperCase() + (this.currentSong.difficulty || 'intermediate').slice(1)}
                        </span>
                    </div>
                </div>
                
                <div class="player-controls">
                    <button class="btn btn-secondary prev-line-btn">⏮ Previous</button>
                    <button class="btn btn-primary play-btn">▶ Play</button>
                    <button class="btn btn-secondary next-line-btn">Next ⏭</button>
                    <label class="auto-advance-label">
                        <input type="checkbox" class="auto-advance-toggle"> Auto Advance
                    </label>
                    <div class="speed-control-group">
                        <label>Speed:</label>
                        <select class="speed-control">
                            <option value="5000">Slow</option>
                            <option value="3000" selected>Normal</option>
                            <option value="2000">Fast</option>
                            <option value="1000">Very Fast</option>
                        </select>
                    </div>
                </div>
                
                <div class="lyrics-content">
                    <div class="lyrics-display">
                        <div class="current-line-display">
                            <div class="line-counter">Line ${this.currentLineIndex + 1} of ${this.currentSong.lyrics.length}</div>
                            <div class="current-lyric" id="current-lyric">
                                ${this.renderCurrentLine()}
                            </div>
                        </div>
                        
                        <div class="all-lyrics">
                            <h3>All Lyrics</h3>
                            <div class="lyrics-list">
                                ${this.currentSong.lyrics.map((line, index) => `
                                    <div class="lyric-line ${index === this.currentLineIndex ? 'active' : ''}" 
                                         data-line-index="${index}">
                                        <span class="line-number">${index + 1}</span>
                                        <div class="line-content">
                                            <div class="line-text">${this.escapeHtml(line.line)}</div>
                                            ${line.korean ? `<div class="line-korean">${this.escapeHtml(line.korean)}</div>` : ''}
                                            ${line.romanization ? `<div class="line-romanization">${this.escapeHtml(line.romanization)}</div>` : ''}
                                            ${line.notes ? `<div class="line-notes">${this.escapeHtml(line.notes)}</div>` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="song-extras">
                        ${this.renderVocabularySection()}
                        ${this.renderCulturalNotes()}
                    </div>
                </div>
                
                <div class="keyboard-shortcuts">
                    <h4>Keyboard Shortcuts</h4>
                    <div class="shortcuts-grid">
                        <span>Space</span><span>Play/Pause</span>
                        <span>←</span><span>Previous Line</span>
                        <span>→</span><span>Next Line</span>
                        <span>A</span><span>Toggle Auto Advance</span>
                        <span>Esc</span><span>Back to Songs</span>
                    </div>
                </div>
            </div>
        `;
        
        this.updatePlayerState();
    }
    
    renderCurrentLine() {
        if (!this.currentSong || this.currentLineIndex >= this.currentSong.lyrics.length) {
            return '<div class="line-text">Song Complete</div>';
        }
        
        const line = this.currentSong.lyrics[this.currentLineIndex];
        return `
            <div class="line-text">${this.highlightVocabulary(line.line)}</div>
            ${line.korean ? `<div class="line-korean">${this.highlightVocabulary(line.korean)}</div>` : ''}
            ${line.romanization ? `<div class="line-romanization">${this.escapeHtml(line.romanization)}</div>` : ''}
            ${line.notes ? `<div class="line-notes">${this.escapeHtml(line.notes)}</div>` : ''}
        `;
    }
    
    renderVocabularySection() {
        if (!this.currentSong.vocabulary || this.currentSong.vocabulary.length === 0) {
            return '';
        }
        
        return `
            <div class="vocabulary-section">
                <h3>Vocabulary</h3>
                <div class="vocabulary-list">
                    ${this.currentSong.vocabulary.map(item => `
                        <div class="vocab-item">
                            <div class="vocab-word">${this.escapeHtml(item.word)}</div>
                            <div class="vocab-korean">${this.escapeHtml(item.korean)}</div>
                            <div class="vocab-romanization">${this.escapeHtml(item.romanization)}</div>
                            <div class="vocab-meaning">${this.escapeHtml(item.meaning)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderCulturalNotes() {
        if (!this.currentSong.culturalNotes || this.currentSong.culturalNotes.length === 0) {
            return '';
        }
        
        return `
            <div class="cultural-notes">
                <h3>Cultural Notes</h3>
                <ul>
                    ${this.currentSong.culturalNotes.map(note => `
                        <li>${this.escapeHtml(note)}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    highlightVocabulary(text) {
        let highlightedText = this.escapeHtml(text);
        
        // Highlight vocabulary words
        this.vocabulary.forEach((item, word) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            highlightedText = highlightedText.replace(regex, `<span class="vocab-word" title="${item.meaning}">${word}</span>`);
        });
        
        return highlightedText;
    }
    
    togglePlayback() {
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }
    
    startPlayback() {
        this.isPlaying = true;
        this.updatePlayerState();
        
        if (this.autoAdvance) {
            this.scheduleNextLine();
        }
    }
    
    stopPlayback() {
        this.isPlaying = false;
        this.clearTimer();
        this.updatePlayerState();
    }
    
    scheduleNextLine() {
        this.clearTimer();
        
        this.timer = setTimeout(() => {
            this.nextLine();
            if (this.isPlaying && this.autoAdvance && this.currentLineIndex < this.currentSong.lyrics.length) {
                this.scheduleNextLine();
            } else {
                this.stopPlayback();
            }
        }, this.playbackSpeed);
    }
    
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    
    nextLine() {
        if (this.currentLineIndex < this.currentSong.lyrics.length - 1) {
            this.currentLineIndex++;
            this.updateCurrentLine();
        } else {
            this.stopPlayback();
        }
    }
    
    previousLine() {
        if (this.currentLineIndex > 0) {
            this.currentLineIndex--;
            this.updateCurrentLine();
        }
    }
    
    goToLine(lineIndex) {
        if (lineIndex >= 0 && lineIndex < this.currentSong.lyrics.length) {
            this.currentLineIndex = lineIndex;
            this.updateCurrentLine();
        }
    }
    
    updateCurrentLine() {
        const currentLyricDisplay = document.getElementById('current-lyric');
        if (currentLyricDisplay) {
            currentLyricDisplay.innerHTML = this.renderCurrentLine();
        }
        
        // Update line counter
        const lineCounter = document.querySelector('.line-counter');
        if (lineCounter) {
            lineCounter.textContent = `Line ${this.currentLineIndex + 1} of ${this.currentSong.lyrics.length}`;
        }
        
        // Update active line in lyrics list
        document.querySelectorAll('.lyric-line').forEach((line, index) => {
            line.classList.toggle('active', index === this.currentLineIndex);
        });
        
        // Scroll active line into view
        const activeLine = document.querySelector('.lyric-line.active');
        if (activeLine) {
            activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    updatePlayerState() {
        const playBtn = document.querySelector('.play-btn');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
        }
    }
    
    toggleAutoAdvance() {
        this.autoAdvance = !this.autoAdvance;
        
        const checkbox = document.querySelector('.auto-advance-toggle');
        if (checkbox) {
            checkbox.checked = this.autoAdvance;
        }
        
        if (this.autoAdvance && this.isPlaying) {
            this.scheduleNextLine();
        } else {
            this.clearTimer();
        }
    }
    
    changeSpeed(speed) {
        this.playbackSpeed = parseInt(speed);
        
        if (this.autoAdvance && this.isPlaying) {
            this.scheduleNextLine();
        }
    }
    
    showVocabularyPopup(word, element) {
        const vocabItem = this.vocabulary.get(word.toLowerCase());
        if (!vocabItem) return;
        
        // Remove existing popup
        const existingPopup = document.querySelector('.vocab-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create popup
        const popup = document.createElement('div');
        popup.className = 'vocab-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-word">${this.escapeHtml(vocabItem.word)}</div>
                <div class="popup-korean">${this.escapeHtml(vocabItem.korean)}</div>
                <div class="popup-romanization">${this.escapeHtml(vocabItem.romanization)}</div>
                <div class="popup-meaning">${this.escapeHtml(vocabItem.meaning)}</div>
                <button class="popup-close">×</button>
            </div>
        `;
        
        // Position popup
        const rect = element.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.top = (rect.bottom + 10) + 'px';
        popup.style.left = rect.left + 'px';
        popup.style.zIndex = '9999';
        
        document.body.appendChild(popup);
        
        // Close popup on click outside or close button
        const closePopup = () => popup.remove();
        popup.querySelector('.popup-close').addEventListener('click', closePopup);
        
        setTimeout(() => {
            document.addEventListener('click', closePopup, { once: true });
        }, 100);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    handleError(error) {
        const container = document.getElementById('lyrics-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="lyrics-error">
                <h2>Unable to Load Lyrics</h2>
                <p>We're having trouble loading the song lyrics. Please check your internet connection and try again.</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                <a href="../index.html" class="btn btn-outline">Return Home</a>
            </div>
        `;
    }
}

// Initialize lyrics player when DOM is loaded
let lyricsPlayer;

document.addEventListener('DOMContentLoaded', () => {
    lyricsPlayer = new LyricsPlayer();
});

// CSS for lyrics styling
const lyricsStyles = `
    .lyrics-home {
        max-width: 1000px;
        margin: 0 auto;
    }
    
    .lyrics-header {
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .difficulty-filters {
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .filter-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 1rem;
    }
    
    .difficulty-filter.active {
        background: var(--primary-color, #ff6b6b);
        color: white;
        border-color: var(--primary-color, #ff6b6b);
    }
    
    .songs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1.5rem;
    }
    
    .song-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid #eee;
    }
    
    .song-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .song-title {
        color: var(--primary-color, #ff6b6b);
        margin-bottom: 0.5rem;
    }
    
    .song-artist {
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .song-album {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }
    
    .difficulty-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 500;
        color: white;
        margin-bottom: 1rem;
    }
    
    .difficulty-beginner { background: #2ecc71; }
    .difficulty-intermediate { background: #f39c12; }
    .difficulty-advanced { background: #e74c3c; }
    
    .song-stats {
        display: flex;
        gap: 1rem;
        font-size: 0.9rem;
        color: #666;
    }
    
    .lyrics-player {
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .song-header {
        display: flex;
        align-items: center;
        gap: 2rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .song-title-info h2 {
        margin-bottom: 0.5rem;
        color: var(--primary-color, #ff6b6b);
    }
    
    .artist-info {
        margin-bottom: 1rem;
        color: #666;
    }
    
    .player-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        flex-wrap: wrap;
    }
    
    .auto-advance-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .speed-control-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .speed-control {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    
    .lyrics-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }
    
    .lyrics-display {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        overflow: hidden;
    }
    
    .current-line-display {
        padding: 2rem;
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        color: white;
        text-align: center;
    }
    
    .line-counter {
        font-size: 0.9rem;
        opacity: 0.9;
        margin-bottom: 1rem;
    }
    
    .current-lyric .line-text {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        line-height: 1.4;
    }
    
    .current-lyric .line-korean {
        font-size: 1.3rem;
        margin-bottom: 0.5rem;
    }
    
    .current-lyric .line-romanization {
        font-style: italic;
        opacity: 0.9;
        margin-bottom: 0.5rem;
    }
    
    .current-lyric .line-notes {
        font-size: 0.9rem;
        opacity: 0.8;
    }
    
    .all-lyrics {
        padding: 1.5rem;
    }
    
    .lyrics-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #eee;
        border-radius: 4px;
    }
    
    .lyric-line {
        display: flex;
        padding: 1rem;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background 0.3s ease;
    }
    
    .lyric-line:hover {
        background: #f8f9fa;
    }
    
    .lyric-line.active {
        background: #fff5f5;
        border-left: 4px solid var(--primary-color, #ff6b6b);
    }
    
    .line-number {
        width: 30px;
        color: #666;
        font-weight: 500;
        flex-shrink: 0;
    }
    
    .line-content {
        flex: 1;
    }
    
    .line-text {
        font-weight: 500;
        margin-bottom: 0.25rem;
    }
    
    .line-korean {
        color: #666;
        margin-bottom: 0.25rem;
    }
    
    .line-romanization {
        font-style: italic;
        color: #888;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }
    
    .line-notes {
        font-size: 0.8rem;
        color: #999;
    }
    
    .vocab-word {
        background: #ffe66d;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        cursor: pointer;
        font-weight: 500;
    }
    
    .vocab-word:hover {
        background: #ffd93d;
    }
    
    .song-extras {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .vocabulary-section,
    .cultural-notes {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .vocabulary-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .vocab-item {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
        border-left: 4px solid var(--primary-color, #ff6b6b);
    }
    
    .vocab-word {
        font-weight: 600;
        color: var(--primary-color, #ff6b6b);
    }
    
    .vocab-korean {
        font-size: 1.1rem;
        margin: 0.25rem 0;
    }
    
    .vocab-romanization {
        font-style: italic;
        color: #666;
        margin-bottom: 0.25rem;
    }
    
    .vocab-meaning {
        color: #555;
    }
    
    .vocab-popup {
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        padding: 1rem;
        max-width: 300px;
        z-index: 9999;
    }
    
    .popup-content {
        position: relative;
    }
    
    .popup-close {
        position: absolute;
        top: -0.5rem;
        right: -0.5rem;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .keyboard-shortcuts {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        margin-top: 2rem;
    }
    
    .shortcuts-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.5rem 1rem;
        font-family: monospace;
        font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
        .lyrics-content {
            grid-template-columns: 1fr;
        }
        
        .song-header {
            flex-direction: column;
            text-align: center;
        }
        
        .player-controls {
            justify-content: center;
        }
        
        .current-lyric .line-text {
            font-size: 1.2rem;
        }
        
        .songs-grid {
            grid-template-columns: 1fr;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = lyricsStyles;
document.head.appendChild(styleSheet);
