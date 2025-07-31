/**
 * Korean Phrase Generator
 * Displays random Korean phrases with romanization and English translation
 */

class PhraseGenerator {
    constructor() {
        this.phrases = [];
        this.currentPhrase = null;
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        await this.loadPhrases();
        this.setupEventListeners();
        this.displayRandomPhrase();
    }
    
    async loadPhrases() {
        this.isLoading = true;
        this.updateLoadingState();
        
        try {
            const response = await fetch('/data/phrases.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.phrases = data.phrases || [];
            
            if (this.phrases.length === 0) {
                throw new Error('No phrases found in data');
            }
            
            console.log(`Loaded ${this.phrases.length} Korean phrases`);
        } catch (error) {
            console.error('Error loading phrases:', error);
            this.handleError(error);
        } finally {
            this.isLoading = false;
            this.updateLoadingState();
        }
    }
    
    setupEventListeners() {
        const newPhraseBtn = document.getElementById('new-phrase-btn');
        if (newPhraseBtn) {
            newPhraseBtn.addEventListener('click', () => {
                this.displayRandomPhrase();
            });
        }
        
        // Keyboard shortcut (Space key) for new phrase
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.displayRandomPhrase();
            }
        });
        
        // Auto-refresh every 30 seconds if user is idle
        let idleTimer;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                this.displayRandomPhrase();
            }, 30000);
        };
        
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetIdleTimer, { passive: true });
        });
        
        resetIdleTimer();
    }
    
    displayRandomPhrase() {
        if (this.isLoading || this.phrases.length === 0) {
            return;
        }
        
        // Get random phrase, ensuring it's different from the current one
        let randomPhrase;
        do {
            randomPhrase = this.phrases[Math.floor(Math.random() * this.phrases.length)];
        } while (this.phrases.length > 1 && randomPhrase === this.currentPhrase);
        
        this.currentPhrase = randomPhrase;
        this.renderPhrase(randomPhrase);
        this.saveToHistory(randomPhrase);
    }
    
    renderPhrase(phrase) {
        const phraseContainer = document.getElementById('daily-phrase');
        if (!phraseContainer) return;
        
        phraseContainer.innerHTML = `
            <div class="phrase-content">
                <div class="phrase-korean">${this.escapeHtml(phrase.korean)}</div>
                <div class="phrase-romanization">${this.escapeHtml(phrase.romanization)}</div>
                <div class="phrase-english">${this.escapeHtml(phrase.english)}</div>
                ${phrase.category ? `<div class="phrase-category">${this.escapeHtml(phrase.category)}</div>` : ''}
                ${phrase.usage ? `<div class="phrase-usage"><strong>Usage:</strong> ${this.escapeHtml(phrase.usage)}</div>` : ''}
            </div>
        `;
        
        // Add animation
        phraseContainer.classList.add('phrase-update');
        setTimeout(() => {
            phraseContainer.classList.remove('phrase-update');
        }, 500);
        
        // Update button text
        const newPhraseBtn = document.getElementById('new-phrase-btn');
        if (newPhraseBtn) {
            newPhraseBtn.textContent = 'Get New Phrase';
            newPhraseBtn.disabled = false;
        }
        
        // Announce to screen readers
        this.announcePhrase(phrase);
    }
    
    updateLoadingState() {
        const phraseContainer = document.getElementById('daily-phrase');
        const newPhraseBtn = document.getElementById('new-phrase-btn');
        
        if (this.isLoading) {
            if (phraseContainer) {
                phraseContainer.innerHTML = '<div class="phrase-loading">Loading Korean phrases...</div>';
            }
            if (newPhraseBtn) {
                newPhraseBtn.textContent = 'Loading...';
                newPhraseBtn.disabled = true;
            }
        } else if (newPhraseBtn) {
            newPhraseBtn.disabled = false;
        }
    }
    
    handleError(error) {
        const phraseContainer = document.getElementById('daily-phrase');
        if (!phraseContainer) return;
        
        phraseContainer.innerHTML = `
            <div class="phrase-error">
                <div class="error-message">Failed to load Korean phrases</div>
                <div class="error-details">Please check your internet connection and try again</div>
                <button class="btn btn-outline retry-btn" onclick="phraseGenerator.init()">Retry</button>
            </div>
        `;
        
        console.error('Phrase generator error:', error);
    }
    
    saveToHistory(phrase) {
        if (!window.KStyleUtils) return;
        
        const history = window.KStyleUtils.storage.get('phraseHistory', []);
        
        // Add current phrase to history
        history.unshift({
            ...phrase,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 phrases
        const limitedHistory = history.slice(0, 10);
        
        window.KStyleUtils.storage.set('phraseHistory', limitedHistory);
    }
    
    getHistory() {
        if (!window.KStyleUtils) return [];
        return window.KStyleUtils.storage.get('phraseHistory', []);
    }
    
    announcePhrase(phrase) {
        // Create announcement for screen readers
        const announcement = `New Korean phrase: ${phrase.korean}, romanized as ${phrase.romanization}, meaning ${phrase.english}`;
        
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = announcement;
        
        document.body.appendChild(announcer);
        
        setTimeout(() => {
            document.body.removeChild(announcer);
        }, 1000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Public method to get current phrase
    getCurrentPhrase() {
        return this.currentPhrase;
    }
    
    // Public method to get phrase count
    getPhraseCount() {
        return this.phrases.length;
    }
    
    // Public method to search phrases
    searchPhrases(query) {
        if (!query) return this.phrases;
        
        const lowerQuery = query.toLowerCase();
        return this.phrases.filter(phrase => 
            phrase.korean.toLowerCase().includes(lowerQuery) ||
            phrase.romanization.toLowerCase().includes(lowerQuery) ||
            phrase.english.toLowerCase().includes(lowerQuery) ||
            (phrase.category && phrase.category.toLowerCase().includes(lowerQuery))
        );
    }
    
    // Public method to get phrases by category
    getPhrasesByCategory(category) {
        return this.phrases.filter(phrase => 
            phrase.category && phrase.category.toLowerCase() === category.toLowerCase()
        );
    }
    
    // Public method to get random phrase from specific category
    getRandomPhraseFromCategory(category) {
        const categoryPhrases = this.getPhrasesByCategory(category);
        if (categoryPhrases.length === 0) return null;
        
        return categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];
    }
}

// Initialize phrase generator when DOM is loaded
let phraseGenerator;

document.addEventListener('DOMContentLoaded', () => {
    phraseGenerator = new PhraseGenerator();
});

// Export for use in other scripts
window.PhraseGenerator = PhraseGenerator;

// CSS for phrase animations (inject into head)
const phraseStyles = `
    .phrase-content {
        text-align: center;
        padding: 1rem;
    }
    
    .phrase-korean {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--dark-color, #2c3e50);
    }
    
    .phrase-romanization {
        font-style: italic;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: #666;
    }
    
    .phrase-english {
        font-size: 1rem;
        margin-bottom: 1rem;
        color: #555;
    }
    
    .phrase-category {
        display: inline-block;
        background: var(--primary-color, #ff6b6b);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
    
    .phrase-usage {
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
        margin-top: 0.5rem;
    }
    
    .phrase-update {
        animation: phraseUpdate 0.5s ease-in-out;
    }
    
    @keyframes phraseUpdate {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    
    .phrase-error {
        text-align: center;
        padding: 1rem;
        color: #e74c3c;
    }
    
    .error-message {
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    
    .error-details {
        font-size: 0.9rem;
        margin-bottom: 1rem;
        color: #666;
    }
    
    .retry-btn {
        margin-top: 0.5rem;
    }
    
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    
    /* Responsive adjustments */
    @media (max-width: 480px) {
        .phrase-korean {
            font-size: 1.5rem;
        }
        
        .phrase-romanization {
            font-size: 1rem;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = phraseStyles;
document.head.appendChild(styleSheet);
