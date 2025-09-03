/**
 * Korean Phrase Generator
 * Displays random Korean phrases with romanization and English translation
 */

class PhraseGenerator {
    constructor() {
        this.phrases = [];
        this.currentPhrase = null;
        this.isLoading = false;
        this.hasError = false;
        this.phraseHistory = [];
        this.MAX_HISTORY = 10;
        
        this.init();
    }
    
    async init() {
        this.isLoading = true;
        this.updateLoadingState();
        try {
            await this.loadPhrases();
            this.setupEventListeners();
            this.displayRandomPhrase();
            this.updateHistoryDisplay();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.handleError(error.message);
        } finally {
            this.isLoading = false;
            this.updateLoadingState();
        }
    }
    
    async loadPhrases() {
        try {
            const response = await fetch('/data/phrases.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.phrases = data.phrases || [];
            if (this.phrases.length === 0) {
                throw new Error('No phrases found in the JSON file.');
            }
            console.log(`Loaded ${this.phrases.length} Korean phrases.`);
        } catch (error) {
            throw new Error(`Error loading phrases: ${error.message}`);
        }
    }
    
    setupEventListeners() {
        const newPhraseBtn = document.getElementById('generate-phrase-btn');
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        const exportPhrasesBtn = document.getElementById('export-phrases-btn');

        if (newPhraseBtn) {
            newPhraseBtn.addEventListener('click', () => {
                this.displayRandomPhrase(true); // true to add to history
            });
        }
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }
        if (exportPhrasesBtn) {
            exportPhrasesBtn.addEventListener('click', () => {
                this.exportPhrases();
            });
        }
    }

    displayRandomPhrase(addToHistory = false) {
        const categorySelect = document.getElementById('category-select');
        const selectedCategory = categorySelect ? categorySelect.value : 'all';

        let filteredPhrases = this.phrases;
        if (selectedCategory !== 'all') {
            filteredPhrases = this.phrases.filter(phrase => 
                phrase.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }
        if (filteredPhrases.length === 0) {
            this.handleError('No phrases found for this category. Try selecting a different category.', false);
            return;
        }

        const randomIndex = Math.floor(Math.random() * filteredPhrases.length);
        this.currentPhrase = filteredPhrases[randomIndex];
        
        const phraseContainer = document.getElementById('current-phrase-display');
        phraseContainer.innerHTML = `
            <div class="phrase-content">
                <div class="phrase-korean-display">${this.currentPhrase.korean}</div>
                <div class="phrase-romanization-display">${this.currentPhrase.romanization}</div>
                <div class="phrase-english-display">${this.currentPhrase.english}</div>
                <div class="phrase-category-display">#${this.currentPhrase.category}</div>
                <div class="phrase-audio-btn">
                     <button class="btn btn-audio" onclick="playAudio('${this.currentPhrase.korean}')">🔊</button>
                </div>
            </div>
        `;
        if (addToHistory) {
            this.phraseHistory.unshift(this.currentPhrase);
            if (this.phraseHistory.length > this.MAX_HISTORY) {
                this.phraseHistory.pop();
            }
            this.updateHistoryDisplay();
        }
    }
    
    updateHistoryDisplay() {
        const historyContainer = document.getElementById('phrase-history-container');
        if (!historyContainer) return;

        if (this.phraseHistory.length === 0) {
            historyContainer.innerHTML = `
                <div class="no-history">
                    <p>No phrases generated yet. Start practicing to see your phrase history!</p>
                </div>
            `;
            const historyControls = document.getElementById('history-controls');
            if (historyControls) {
                 historyControls.style.display = 'none';
            }
        } else {
            historyContainer.innerHTML = '';
            this.phraseHistory.forEach(phrase => {
                const historyCard = document.createElement('div');
                historyCard.className = 'phrase-history-card';
                historyCard.innerHTML = `
                    <div class="phrase-content">
                        <div class="phrase-korean-display">${phrase.korean}</div>
                        <div class="phrase-romanization-display">${phrase.romanization}</div>
                        <div class="phrase-english-display">${phrase.english}</div>
                        <div class="phrase-category-display">#${phrase.category}</div>
                    </div>
                `;
                historyContainer.appendChild(historyCard);
            });
            const historyControls = document.getElementById('history-controls');
            if (historyControls) {
                 historyControls.style.display = 'flex';
            }
        }
    }

    clearHistory() {
        this.phraseHistory = [];
        this.updateHistoryDisplay();
        console.log('Phrase history cleared.');
    }

    exportPhrases() {
        if (this.phraseHistory.length === 0) {
            alert('No phrases to export!');
            return;
        }

        const phrasesText = this.phraseHistory.map(p => 
            `Korean: ${p.korean}\nRomanization: ${p.romanization}\nEnglish: ${p.english}\nCategory: ${p.category}\n---`
        ).join('\n');
        
        const blob = new Blob([phrasesText], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'korean-phrases.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('Phrases exported successfully.');
    }

    updateLoadingState() {
        const phraseContainer = document.getElementById('current-phrase-display');
        if (this.isLoading) {
            phraseContainer.innerHTML = `<div class="phrase-loading">Loading phrases...</div>`;
        }
    }
    
    handleError(message, isCritical = true) {
        this.hasError = isCritical;
        const phraseContainer = document.getElementById('current-phrase-display');
        phraseContainer.innerHTML = `
            <div class="phrase-error">
                <p class="error-message">Error: Could not load phrases.</p>
                <p class="error-details">${message}</p>
                ${isCritical ? `<button class="retry-btn" onclick="location.reload()">Retry</button>` : ''}
            </div>
        `;
    }
}

// A dummy playAudio function to prevent errors until audio files are added
function playAudio(text) {
    console.log(`Playing audio for: "${text}"`);
}

document.addEventListener('DOMContentLoaded', () => {
    new PhraseGenerator();
});