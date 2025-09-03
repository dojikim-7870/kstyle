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
        
        this.init();
    }
    
    async init() {
        this.isLoading = true;
        this.updateLoadingState();
        try {
            await this.loadPhrases();
            this.setupEventListeners();
            this.displayRandomPhrase();
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
        // 올바른 버튼 ID로 수정되었습니다!
        const newPhraseBtn = document.getElementById('generate-phrase-btn');
        if (newPhraseBtn) {
            newPhraseBtn.addEventListener('click', () => {
                console.log('Generate button clicked. Displaying new phrase...');
                this.displayRandomPhrase();
            });
        }
    }

    displayRandomPhrase() {
        const categorySelect = document.getElementById('category-select');
        const selectedCategory = categorySelect ? categorySelect.value : 'all';

        let filteredPhrases = this.phrases;
        if (selectedCategory !== 'all') {
            filteredPhrases = this.phrases.filter(phrase => 
                phrase.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        if (filteredPhrases.length === 0) {
            const phraseContainer = document.getElementById('current-phrase-display');
            phraseContainer.innerHTML = `
                <div class="phrase-content">
                    <div class="phrase-korean-display">No phrases found for this category.</div>
                    <div class="phrase-english-display">Try selecting a different category.</div>
                </div>
            `;
            return;
        }

        const phraseContainer = document.getElementById('current-phrase-display');
        const randomIndex = Math.floor(Math.random() * filteredPhrases.length);
        this.currentPhrase = filteredPhrases[randomIndex];
        
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
    }
    
    updateLoadingState() {
        const phraseContainer = document.getElementById('current-phrase-display');
        if (this.isLoading) {
            phraseContainer.innerHTML = `<div class="phrase-loading">Loading phrases...</div>`;
        }
    }
    
    handleError(message) {
        this.hasError = true;
        const phraseContainer = document.getElementById('current-phrase-display');
        phraseContainer.innerHTML = `
            <div class="phrase-error">
                <p class="error-message">Error: Could not load phrases.</p>
                <p class="error-details">${message}</p>
                <button class="retry-btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Instantiate the Phrase Generator when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PhraseGenerator();
});

// A dummy playAudio function to prevent errors until audio files are added
function playAudio(text) {
    console.log(`Playing audio for: "${text}"`);
    // Placeholder for real audio playback logic
}