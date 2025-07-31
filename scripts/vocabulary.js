/**
 * Korean Vocabulary Learning System
 * Interactive vocabulary table with search, filtering, and study features
 */

class VocabularyManager {
    constructor() {
        this.vocabulary = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.currentLevel = 'all';
        this.searchQuery = '';
        this.sortBy = 'korean';
        this.sortOrder = 'asc';
        this.studyMode = false;
        this.studyCards = [];
        this.currentCardIndex = 0;
        
        this.init();
    }
    
    async init() {
        await this.loadVocabulary();
        this.setupEventListeners();
        this.displayVocabularyTable();
    }
    
    async loadVocabulary() {
        try {
            const response = await fetch('/data/vocabulary.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.categories = data.categories || [];
            
            // Flatten vocabulary from all categories
            this.vocabulary = this.categories.flatMap(category => 
                category.words.map(word => ({
                    ...word,
                    category: category.name,
                    categoryId: category.id
                }))
            );
            
            console.log(`Loaded ${this.vocabulary.length} vocabulary words from ${this.categories.length} categories`);
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            this.handleError(error);
        }
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('vocab-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterAndDisplayVocabulary();
            });
        }
        
        // Category filter
        document.addEventListener('change', (e) => {
            if (e.target.matches('#category-filter')) {
                this.currentCategory = e.target.value;
                this.filterAndDisplayVocabulary();
            }
            
            if (e.target.matches('#level-filter')) {
                this.currentLevel = e.target.value;
                this.filterAndDisplayVocabulary();
            }
        });
        
        // Sorting
        document.addEventListener('click', (e) => {
            if (e.target.matches('.sort-btn')) {
                const sortBy = e.target.dataset.sortBy;
                this.toggleSort(sortBy);
            }
            
            if (e.target.matches('.study-mode-btn')) {
                this.toggleStudyMode();
            }
            
            if (e.target.matches('.export-btn')) {
                this.exportVocabulary();
            }
            
            if (e.target.matches('.clear-filters-btn')) {
                this.clearFilters();
            }
            
            if (e.target.matches('.vocab-row')) {
                this.showWordDetails(e.target.dataset.wordIndex);
            }
            
            // Study card controls
            if (e.target.matches('.flip-card-btn')) {
                this.flipStudyCard();
            }
            
            if (e.target.matches('.next-card-btn')) {
                this.nextStudyCard();
            }
            
            if (e.target.matches('.prev-card-btn')) {
                this.previousStudyCard();
            }
            
            if (e.target.matches('.exit-study-btn')) {
                this.exitStudyMode();
            }
            
            if (e.target.matches('.shuffle-cards-btn')) {
                this.shuffleStudyCards();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.studyMode) {
                switch(e.key) {
                    case ' ':
                        e.preventDefault();
                        this.flipStudyCard();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousStudyCard();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextStudyCard();
                        break;
                    case 'Escape':
                        this.exitStudyMode();
                        break;
                }
            }
        });
    }
    
    displayVocabularyTable() {
        const container = document.getElementById('vocabulary-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="vocabulary-page">
                <div class="vocabulary-header">
                    <h2>Korean Vocabulary</h2>
                    <p>Comprehensive vocabulary collection organized by categories and difficulty levels</p>
                </div>
                
                <div class="vocabulary-controls">
                    <div class="search-section">
                        <input type="text" id="vocab-search" placeholder="Search vocabulary..." class="search-input">
                    </div>
                    
                    <div class="filter-section">
                        <select id="category-filter" class="filter-select">
                            <option value="all">All Categories</option>
                            ${this.categories.map(cat => `
                                <option value="${cat.id}">${this.escapeHtml(cat.name)}</option>
                            `).join('')}
                        </select>
                        
                        <select id="level-filter" class="filter-select">
                            <option value="all">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                        
                        <button class="btn btn-outline clear-filters-btn">Clear Filters</button>
                    </div>
                    
                    <div class="action-section">
                        <button class="btn btn-primary study-mode-btn">Study Mode</button>
                        <button class="btn btn-secondary export-btn">Export</button>
                    </div>
                </div>
                
                <div class="vocabulary-stats">
                    <div class="stat-item">
                        <span class="stat-number">${this.vocabulary.length}</span>
                        <span class="stat-label">Total Words</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.categories.length}</span>
                        <span class="stat-label">Categories</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.getFilteredVocabulary().length}</span>
                        <span class="stat-label">Filtered Results</span>
                    </div>
                </div>
                
                <div class="vocabulary-table-container">
                    <table class="vocabulary-table">
                        <thead>
                            <tr>
                                <th>
                                    <button class="sort-btn ${this.sortBy === 'korean' ? 'active' : ''}" data-sort-by="korean">
                                        Korean ${this.getSortIcon('korean')}
                                    </button>
                                </th>
                                <th>
                                    <button class="sort-btn ${this.sortBy === 'romanization' ? 'active' : ''}" data-sort-by="romanization">
                                        Romanization ${this.getSortIcon('romanization')}
                                    </button>
                                </th>
                                <th>
                                    <button class="sort-btn ${this.sortBy === 'english' ? 'active' : ''}" data-sort-by="english">
                                        English ${this.getSortIcon('english')}
                                    </button>
                                </th>
                                <th>
                                    <button class="sort-btn ${this.sortBy === 'partOfSpeech' ? 'active' : ''}" data-sort-by="partOfSpeech">
                                        Part of Speech ${this.getSortIcon('partOfSpeech')}
                                    </button>
                                </th>
                                <th>
                                    <button class="sort-btn ${this.sortBy === 'level' ? 'active' : ''}" data-sort-by="level">
                                        Level ${this.getSortIcon('level')}
                                    </button>
                                </th>
                                <th>
                                    <button class="sort-btn ${this.sortBy === 'category' ? 'active' : ''}" data-sort-by="category">
                                        Category ${this.getSortIcon('category')}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody id="vocabulary-tbody">
                            ${this.renderVocabularyRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.updateStats();
    }
    
    renderVocabularyRows() {
        const filteredVocab = this.getFilteredVocabulary();
        
        if (filteredVocab.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="no-results">
                        No vocabulary words match your search criteria.
                    </td>
                </tr>
            `;
        }
        
        return filteredVocab.map((word, index) => `
            <tr class="vocab-row" data-word-index="${index}">
                <td class="korean-text">${this.escapeHtml(word.korean)}</td>
                <td class="romanization-text">${this.escapeHtml(word.romanization)}</td>
                <td class="english-text">${this.escapeHtml(word.english)}</td>
                <td class="part-of-speech">
                    <span class="pos-badge pos-${word.partOfSpeech}">
                        ${this.escapeHtml(word.partOfSpeech)}
                    </span>
                </td>
                <td class="level">
                    <span class="level-badge level-${word.level}">
                        ${this.escapeHtml(word.level)}
                    </span>
                </td>
                <td class="category">${this.escapeHtml(word.category)}</td>
            </tr>
        `).join('');
    }
    
    getFilteredVocabulary() {
        let filtered = [...this.vocabulary];
        
        // Apply category filter
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(word => word.categoryId === this.currentCategory);
        }
        
        // Apply level filter
        if (this.currentLevel !== 'all') {
            filtered = filtered.filter(word => word.level === this.currentLevel);
        }
        
        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(word => 
                word.korean.toLowerCase().includes(this.searchQuery) ||
                word.romanization.toLowerCase().includes(this.searchQuery) ||
                word.english.toLowerCase().includes(this.searchQuery) ||
                word.category.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aVal = a[this.sortBy] || '';
            let bVal = b[this.sortBy] || '';
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (this.sortOrder === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
        
        return filtered;
    }
    
    filterAndDisplayVocabulary() {
        const tbody = document.getElementById('vocabulary-tbody');
        if (tbody) {
            tbody.innerHTML = this.renderVocabularyRows();
        }
        this.updateStats();
    }
    
    updateStats() {
        const filteredCount = document.querySelector('.stat-item:nth-child(3) .stat-number');
        if (filteredCount) {
            filteredCount.textContent = this.getFilteredVocabulary().length;
        }
    }
    
    toggleSort(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'asc';
        }
        
        this.filterAndDisplayVocabulary();
        this.updateSortButtons();
    }
    
    updateSortButtons() {
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('active');
            const sortBy = btn.dataset.sortBy;
            btn.innerHTML = `${btn.textContent.split(' ')[0]} ${this.getSortIcon(sortBy)}`;
        });
        
        const activeBtn = document.querySelector(`[data-sort-by="${this.sortBy}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    getSortIcon(sortBy) {
        if (this.sortBy !== sortBy) return '↕️';
        return this.sortOrder === 'asc' ? '↑' : '↓';
    }
    
    clearFilters() {
        this.currentCategory = 'all';
        this.currentLevel = 'all';
        this.searchQuery = '';
        
        document.getElementById('category-filter').value = 'all';
        document.getElementById('level-filter').value = 'all';
        document.getElementById('vocab-search').value = '';
        
        this.filterAndDisplayVocabulary();
    }
    
    toggleStudyMode() {
        if (this.studyMode) {
            this.exitStudyMode();
        } else {
            this.enterStudyMode();
        }
    }
    
    enterStudyMode() {
        this.studyMode = true;
        this.studyCards = this.getFilteredVocabulary();
        this.currentCardIndex = 0;
        
        if (this.studyCards.length === 0) {
            alert('No vocabulary words to study. Please adjust your filters.');
            return;
        }
        
        this.shuffleStudyCards();
        this.displayStudyCard();
    }
    
    exitStudyMode() {
        this.studyMode = false;
        this.displayVocabularyTable();
    }
    
    displayStudyCard() {
        const container = document.getElementById('vocabulary-container');
        if (!container || this.studyCards.length === 0) return;
        
        const currentCard = this.studyCards[this.currentCardIndex];
        
        container.innerHTML = `
            <div class="study-mode">
                <div class="study-header">
                    <h2>Study Mode</h2>
                    <div class="study-progress">
                        <span>${this.currentCardIndex + 1} of ${this.studyCards.length}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((this.currentCardIndex + 1) / this.studyCards.length) * 100}%"></div>
                        </div>
                    </div>
                    <button class="btn btn-outline exit-study-btn">Exit Study Mode</button>
                </div>
                
                <div class="study-card-container">
                    <div class="study-card" id="study-card">
                        <div class="card-front">
                            <div class="card-korean">${this.escapeHtml(currentCard.korean)}</div>
                            <div class="card-category">${this.escapeHtml(currentCard.category)}</div>
                        </div>
                        <div class="card-back" style="display: none;">
                            <div class="card-romanization">${this.escapeHtml(currentCard.romanization)}</div>
                            <div class="card-english">${this.escapeHtml(currentCard.english)}</div>
                            <div class="card-pos">${this.escapeHtml(currentCard.partOfSpeech)}</div>
                            <div class="card-level">Level: ${this.escapeHtml(currentCard.level)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="study-controls">
                    <button class="btn btn-secondary prev-card-btn" ${this.currentCardIndex === 0 ? 'disabled' : ''}>
                        ← Previous
                    </button>
                    <button class="btn btn-primary flip-card-btn">Flip Card</button>
                    <button class="btn btn-secondary next-card-btn" ${this.currentCardIndex === this.studyCards.length - 1 ? 'disabled' : ''}>
                        Next →
                    </button>
                </div>
                
                <div class="study-actions">
                    <button class="btn btn-outline shuffle-cards-btn">Shuffle Cards</button>
                </div>
                
                <div class="study-instructions">
                    <h4>Study Instructions:</h4>
                    <ul>
                        <li>Look at the Korean word and try to recall its meaning</li>
                        <li>Click "Flip Card" or press Space to see the answer</li>
                        <li>Use arrow keys or buttons to navigate between cards</li>
                        <li>Press Escape to exit study mode</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    flipStudyCard() {
        const cardFront = document.querySelector('.card-front');
        const cardBack = document.querySelector('.card-back');
        const flipBtn = document.querySelector('.flip-card-btn');
        
        if (cardFront && cardBack && flipBtn) {
            const isShowingFront = cardFront.style.display !== 'none';
            
            if (isShowingFront) {
                cardFront.style.display = 'none';
                cardBack.style.display = 'block';
                flipBtn.textContent = 'Show Korean';
            } else {
                cardFront.style.display = 'block';
                cardBack.style.display = 'none';
                flipBtn.textContent = 'Flip Card';
            }
        }
    }
    
    nextStudyCard() {
        if (this.currentCardIndex < this.studyCards.length - 1) {
            this.currentCardIndex++;
            this.displayStudyCard();
        }
    }
    
    previousStudyCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.displayStudyCard();
        }
    }
    
    shuffleStudyCards() {
        for (let i = this.studyCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.studyCards[i], this.studyCards[j]] = [this.studyCards[j], this.studyCards[i]];
        }
        
        this.currentCardIndex = 0;
        if (this.studyMode) {
            this.displayStudyCard();
        }
    }
    
    exportVocabulary() {
        const filteredVocab = this.getFilteredVocabulary();
        
        // Create CSV content
        const headers = ['Korean', 'Romanization', 'English', 'Part of Speech', 'Level', 'Category'];
        const csvContent = [
            headers.join(','),
            ...filteredVocab.map(word => [
                `"${word.korean}"`,
                `"${word.romanization}"`,
                `"${word.english}"`,
                `"${word.partOfSpeech}"`,
                `"${word.level}"`,
                `"${word.category}"`
            ].join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'korean-vocabulary.csv';
        link.click();
    }
    
    showWordDetails(wordIndex) {
        const filteredVocab = this.getFilteredVocabulary();
        const word = filteredVocab[wordIndex];
        
        if (!word) return;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'word-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h3>${this.escapeHtml(word.korean)}</h3>
                <div class="word-details">
                    <div class="detail-row">
                        <span class="detail-label">Romanization:</span>
                        <span class="detail-value">${this.escapeHtml(word.romanization)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">English:</span>
                        <span class="detail-value">${this.escapeHtml(word.english)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Part of Speech:</span>
                        <span class="detail-value">
                            <span class="pos-badge pos-${word.partOfSpeech}">
                                ${this.escapeHtml(word.partOfSpeech)}
                            </span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Level:</span>
                        <span class="detail-value">
                            <span class="level-badge level-${word.level}">
                                ${this.escapeHtml(word.level)}
                            </span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span class="detail-value">${this.escapeHtml(word.category)}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal handlers
        const closeModal = () => modal.remove();
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    handleError(error) {
        const container = document.getElementById('vocabulary-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="vocabulary-error">
                <h2>Unable to Load Vocabulary</h2>
                <p>We're having trouble loading the vocabulary data. Please check your internet connection and try again.</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                <a href="../index.html" class="btn btn-outline">Return Home</a>
            </div>
        `;
    }
}

// Initialize vocabulary manager when DOM is loaded
let vocabularyManager;

document.addEventListener('DOMContentLoaded', () => {
    vocabularyManager = new VocabularyManager();
});

// CSS for vocabulary styling
const vocabularyStyles = `
    .vocabulary-page {
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .vocabulary-header {
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .vocabulary-controls {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 2rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .search-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
    }
    
    .filter-section {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .filter-select {
        padding: 0.75rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
    }
    
    .action-section {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .vocabulary-stats {
        display: flex;
        gap: 2rem;
        justify-content: center;
        margin-bottom: 2rem;
    }
    
    .stat-item {
        text-align: center;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        min-width: 120px;
    }
    
    .stat-number {
        display: block;
        font-size: 2rem;
        font-weight: bold;
        color: var(--primary-color, #ff6b6b);
    }
    
    .stat-label {
        font-size: 0.9rem;
        color: #666;
    }
    
    .vocabulary-table-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        overflow: hidden;
    }
    
    .vocabulary-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .vocabulary-table th {
        background: #f8f9fa;
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #eee;
    }
    
    .vocabulary-table td {
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }
    
    .vocab-row {
        cursor: pointer;
        transition: background 0.3s ease;
    }
    
    .vocab-row:hover {
        background: #f8f9fa;
    }
    
    .sort-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 600;
        color: #333;
        transition: color 0.3s ease;
    }
    
    .sort-btn:hover,
    .sort-btn.active {
        color: var(--primary-color, #ff6b6b);
    }
    
    .korean-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--primary-color, #ff6b6b);
    }
    
    .romanization-text {
        font-style: italic;
        color: #666;
    }
    
    .pos-badge,
    .level-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 500;
        color: white;
    }
    
    .pos-noun { background: #3498db; }
    .pos-verb { background: #e74c3c; }
    .pos-adjective { background: #2ecc71; }
    .pos-adverb { background: #f39c12; }
    .pos-interjection { background: #9b59b6; }
    .pos-phrase { background: #95a5a6; }
    .pos-number { background: #34495e; }
    
    .level-beginner { background: #2ecc71; }
    .level-intermediate { background: #f39c12; }
    .level-advanced { background: #e74c3c; }
    
    .no-results {
        text-align: center;
        padding: 2rem;
        color: #666;
        font-style: italic;
    }
    
    /* Study Mode Styles */
    .study-mode {
        max-width: 800px;
        margin: 0 auto;
        text-align: center;
    }
    
    .study-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .study-progress {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .progress-bar {
        width: 200px;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        transition: width 0.3s ease;
    }
    
    .study-card-container {
        margin-bottom: 2rem;
    }
    
    .study-card {
        width: 400px;
        height: 300px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
    }
    
    .card-front,
    .card-back {
        padding: 2rem;
        text-align: center;
    }
    
    .card-korean {
        font-size: 3rem;
        font-weight: bold;
        color: var(--primary-color, #ff6b6b);
        margin-bottom: 1rem;
    }
    
    .card-category {
        font-size: 1rem;
        color: #666;
        font-style: italic;
    }
    
    .card-romanization {
        font-size: 1.5rem;
        font-style: italic;
        color: #666;
        margin-bottom: 1rem;
    }
    
    .card-english {
        font-size: 2rem;
        font-weight: 600;
        color: var(--dark-color, #2c3e50);
        margin-bottom: 1rem;
    }
    
    .card-pos {
        font-size: 1rem;
        margin-bottom: 0.5rem;
    }
    
    .card-level {
        font-size: 0.9rem;
        color: #666;
    }
    
    .study-controls {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .study-actions {
        margin-bottom: 2rem;
    }
    
    .study-instructions {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: left;
    }
    
    .study-instructions ul {
        margin-left: 1.5rem;
    }
    
    /* Word Detail Modal */
    .word-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        position: relative;
    }
    
    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
    }
    
    .modal-close:hover {
        color: #333;
    }
    
    .word-details {
        margin-top: 1rem;
    }
    
    .detail-row {
        display: flex;
        margin-bottom: 1rem;
        align-items: center;
    }
    
    .detail-label {
        font-weight: 600;
        width: 140px;
        color: #666;
    }
    
    .detail-value {
        flex: 1;
    }
    
    @media (max-width: 768px) {
        .vocabulary-controls {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
        
        .filter-section,
        .action-section {
            justify-content: center;
        }
        
        .vocabulary-stats {
            flex-direction: column;
            align-items: center;
        }
        
        .vocabulary-table {
            font-size: 0.9rem;
        }
        
        .vocabulary-table th,
        .vocabulary-table td {
            padding: 0.75rem 0.5rem;
        }
        
        .study-header {
            flex-direction: column;
            gap: 1rem;
        }
        
        .study-card {
            width: 90%;
            max-width: 350px;
        }
        
        .card-korean {
            font-size: 2.5rem;
        }
        
        .card-english {
            font-size: 1.5rem;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = vocabularyStyles;
document.head.appendChild(styleSheet);
