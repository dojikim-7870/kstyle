/**
 * Korean Quiz System
 * Interactive multiple-choice quiz with scoring and progress tracking
 */

class KoreanQuiz {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.timeLimit = 30; // seconds per question
        this.timer = null;
        this.timeLeft = 0;
        this.isQuizActive = false;
        this.categories = [];
        this.selectedCategory = null;
        
        this.init();
    }
    
    async init() {
        await this.loadQuestions();
        this.setupEventListeners();
        this.displayCategories();
    }
    
    async loadQuestions() {
        try {
            const response = await fetch('/data/quiz-questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.categories = data.categories || [];
            
            console.log(`Loaded ${this.categories.length} quiz categories`);
        } catch (error) {
            console.error('Error loading quiz questions:', error);
            this.handleError(error);
        }
    }
    
    setupEventListeners() {
        // Category selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('.category-btn')) {
                const categoryId = e.target.dataset.categoryId;
                this.selectCategory(categoryId);
            }
            
            if (e.target.matches('.start-quiz-btn')) {
                this.startQuiz();
            }
            
            if (e.target.matches('.answer-option')) {
                this.selectAnswer(e.target);
            }
            
            if (e.target.matches('.next-question-btn')) {
                this.nextQuestion();
            }
            
            if (e.target.matches('.restart-quiz-btn')) {
                this.restartQuiz();
            }
            
            if (e.target.matches('.try-different-category-btn')) {
                this.displayCategories();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isQuizActive) return;
            
            // Number keys for answer selection (1-4)
            if (e.key >= '1' && e.key <= '4') {
                const optionIndex = parseInt(e.key) - 1;
                const options = document.querySelectorAll('.answer-option');
                if (options[optionIndex]) {
                    this.selectAnswer(options[optionIndex]);
                }
            }
            
            // Enter key for next question
            if (e.key === 'Enter') {
                const nextBtn = document.querySelector('.next-question-btn');
                if (nextBtn && !nextBtn.disabled) {
                    this.nextQuestion();
                }
            }
            
            // Escape key to pause/resume
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });
        
        // Visibility change handling (pause when tab is not visible)
        document.addEventListener('visibilitychange', () => {
            if (this.isQuizActive && this.timer) {
                if (document.hidden) {
                    this.pauseTimer();
                } else {
                    this.resumeTimer();
                }
            }
        });
    }
    
    displayCategories() {
        const container = document.getElementById('quiz-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="quiz-categories">
                <h2>Choose a Quiz Category</h2>
                <p>Select a category to start your Korean learning quiz</p>
                <div class="categories-grid">
                    ${this.categories.map(category => `
                        <div class="category-card">
                            <h3>${this.escapeHtml(category.name)}</h3>
                            <p>${category.questions.length} questions</p>
                            <button class="btn btn-primary category-btn" data-category-id="${category.id}">
                                Select Category
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="quick-options">
                    <h3>Quick Options</h3>
                    <button class="btn btn-secondary category-btn" data-category-id="mixed">
                        Mixed Questions (All Categories)
                    </button>
                    <button class="btn btn-outline category-btn" data-category-id="random">
                        Random 10 Questions
                    </button>
                </div>
            </div>
        `;
    }
    
    selectCategory(categoryId) {
        this.selectedCategory = categoryId;
        
        if (categoryId === 'mixed') {
            this.questions = this.categories.flatMap(cat => cat.questions);
        } else if (categoryId === 'random') {
            const allQuestions = this.categories.flatMap(cat => cat.questions);
            this.questions = this.shuffleArray(allQuestions).slice(0, 10);
        } else {
            const category = this.categories.find(cat => cat.id === categoryId);
            this.questions = category ? category.questions : [];
        }
        
        this.questions = this.shuffleArray(this.questions);
        this.displayQuizStart();
    }
    
    displayQuizStart() {
        const container = document.getElementById('quiz-container');
        if (!container) return;
        
        const categoryName = this.selectedCategory === 'mixed' ? 'Mixed Questions' :
                           this.selectedCategory === 'random' ? 'Random Questions' :
                           this.categories.find(cat => cat.id === this.selectedCategory)?.name || 'Quiz';
        
        container.innerHTML = `
            <div class="quiz-start">
                <h2>${this.escapeHtml(categoryName)}</h2>
                <div class="quiz-info">
                    <div class="info-item">
                        <span class="info-label">Questions:</span>
                        <span class="info-value">${this.questions.length}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Time per question:</span>
                        <span class="info-value">${this.timeLimit} seconds</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total time:</span>
                        <span class="info-value">~${Math.ceil(this.questions.length * this.timeLimit / 60)} minutes</span>
                    </div>
                </div>
                <div class="quiz-instructions">
                    <h3>Instructions:</h3>
                    <ul>
                        <li>Select the best answer for each question</li>
                        <li>You have ${this.timeLimit} seconds per question</li>
                        <li>Use number keys (1-4) for quick selection</li>
                        <li>Press Enter to move to the next question</li>
                        <li>Press Escape to pause the quiz</li>
                    </ul>
                </div>
                <div class="quiz-controls">
                    <button class="btn btn-primary start-quiz-btn">Start Quiz</button>
                    <button class="btn btn-outline try-different-category-btn">Choose Different Category</button>
                </div>
            </div>
        `;
    }
    
    startQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.isQuizActive = true;
        
        this.displayQuestion();
        this.startTimer();
    }
    
    displayQuestion() {
        const container = document.getElementById('quiz-container');
        if (!container || this.currentQuestionIndex >= this.questions.length) {
            this.endQuiz();
            return;
        }
        
        const question = this.questions[this.currentQuestionIndex];
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        
        container.innerHTML = `
            <div class="quiz-question">
                <div class="quiz-header">
                    <div class="quiz-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${this.currentQuestionIndex + 1} of ${this.questions.length}</span>
                    </div>
                    <div class="quiz-timer">
                        <span class="timer-text">Time: </span>
                        <span class="timer-value" id="timer-display">${this.timeLeft}</span>
                    </div>
                    <div class="quiz-score">
                        <span class="score-text">Score: </span>
                        <span class="score-value">${this.score}</span>
                    </div>
                </div>
                
                <div class="question-content">
                    <h3 class="question-text">${this.escapeHtml(question.question)}</h3>
                    <div class="answer-options">
                        ${question.options.map((option, index) => `
                            <button class="answer-option" data-option-index="${index}">
                                <span class="option-number">${index + 1}</span>
                                <span class="option-text">${this.escapeHtml(option)}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="question-controls">
                    <button class="btn btn-primary next-question-btn" disabled>
                        ${this.currentQuestionIndex === this.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </button>
                    <button class="btn btn-outline pause-btn" onclick="koreanQuiz.togglePause()">Pause</button>
                </div>
            </div>
        `;
    }
    
    selectAnswer(optionElement) {
        // Remove previous selection
        document.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Select current option
        optionElement.classList.add('selected');
        
        // Enable next button
        const nextBtn = document.querySelector('.next-question-btn');
        if (nextBtn) {
            nextBtn.disabled = false;
        }
        
        // Store answer
        const optionIndex = parseInt(optionElement.dataset.optionIndex);
        this.answers[this.currentQuestionIndex] = optionIndex;
    }
    
    nextQuestion() {
        const selectedAnswer = this.answers[this.currentQuestionIndex];
        const question = this.questions[this.currentQuestionIndex];
        
        // Check if answer is correct
        if (selectedAnswer === question.correct) {
            this.score++;
        }
        
        // Move to next question or end quiz
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endQuiz();
        } else {
            this.displayQuestion();
            this.resetTimer();
        }
    }
    
    endQuiz() {
        this.isQuizActive = false;
        this.clearTimer();
        
        const percentage = Math.round((this.score / this.questions.length) * 100);
        const grade = this.getGrade(percentage);
        
        // Save quiz results
        this.saveQuizResults();
        
        const container = document.getElementById('quiz-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="quiz-results">
                <div class="results-header">
                    <h2>Quiz Complete!</h2>
                    <div class="final-score">
                        <span class="score-number">${this.score}</span>
                        <span class="score-total">/ ${this.questions.length}</span>
                    </div>
                    <div class="score-percentage">${percentage}%</div>
                    <div class="score-grade grade-${grade.toLowerCase()}">${grade}</div>
                </div>
                
                <div class="results-details">
                    <h3>Question Review</h3>
                    <div class="question-review">
                        ${this.questions.map((question, index) => {
                            const userAnswer = this.answers[index];
                            const isCorrect = userAnswer === question.correct;
                            
                            return `
                                <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                                    <div class="review-question">
                                        <span class="question-number">${index + 1}.</span>
                                        <span class="question-text">${this.escapeHtml(question.question)}</span>
                                    </div>
                                    <div class="review-answer">
                                        <span class="answer-status">${isCorrect ? '✓' : '✗'}</span>
                                        <span class="your-answer">Your answer: ${question.options[userAnswer] || 'No answer'}</span>
                                        ${!isCorrect ? `<span class="correct-answer">Correct: ${question.options[question.correct]}</span>` : ''}
                                    </div>
                                    ${question.explanation ? `
                                        <div class="explanation">
                                            <strong>Explanation:</strong> ${this.escapeHtml(question.explanation)}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-primary restart-quiz-btn">Retake Quiz</button>
                    <button class="btn btn-secondary try-different-category-btn">Try Different Category</button>
                    <button class="btn btn-outline" onclick="window.print()">Print Results</button>
                </div>
            </div>
        `;
    }
    
    startTimer() {
        this.timeLeft = this.timeLimit;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.timeUp();
            }
        }, 1000);
    }
    
    resetTimer() {
        this.clearTimer();
        this.startTimer();
    }
    
    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = this.timeLeft;
            
            // Add warning classes for low time
            if (this.timeLeft <= 5) {
                timerDisplay.classList.add('timer-warning');
            } else if (this.timeLeft <= 10) {
                timerDisplay.classList.add('timer-caution');
            }
        }
    }
    
    timeUp() {
        // Auto-select a random answer if none selected
        if (this.answers[this.currentQuestionIndex] === undefined) {
            const randomAnswer = Math.floor(Math.random() * this.questions[this.currentQuestionIndex].options.length);
            this.answers[this.currentQuestionIndex] = randomAnswer;
        }
        
        this.nextQuestion();
    }
    
    togglePause() {
        if (this.timer) {
            this.pauseTimer();
        } else {
            this.resumeTimer();
        }
    }
    
    pauseTimer() {
        this.clearTimer();
        
        // Show pause overlay
        const pauseOverlay = document.createElement('div');
        pauseOverlay.className = 'pause-overlay';
        pauseOverlay.innerHTML = `
            <div class="pause-content">
                <h3>Quiz Paused</h3>
                <p>Click Resume to continue</p>
                <button class="btn btn-primary" onclick="koreanQuiz.resumeTimer()">Resume</button>
            </div>
        `;
        
        document.body.appendChild(pauseOverlay);
    }
    
    resumeTimer() {
        // Remove pause overlay
        const pauseOverlay = document.querySelector('.pause-overlay');
        if (pauseOverlay) {
            pauseOverlay.remove();
        }
        
        this.startTimer();
    }
    
    restartQuiz() {
        this.clearTimer();
        this.questions = this.shuffleArray(this.questions);
        this.startQuiz();
    }
    
    getGrade(percentage) {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    }
    
    saveQuizResults() {
        if (!window.KStyleUtils) return;
        
        const results = {
            category: this.selectedCategory,
            score: this.score,
            total: this.questions.length,
            percentage: Math.round((this.score / this.questions.length) * 100),
            date: new Date().toISOString(),
            answers: this.answers
        };
        
        const history = window.KStyleUtils.storage.get('quizHistory', []);
        history.unshift(results);
        
        // Keep only last 20 quiz results
        const limitedHistory = history.slice(0, 20);
        window.KStyleUtils.storage.set('quizHistory', limitedHistory);
    }
    
    getQuizHistory() {
        if (!window.KStyleUtils) return [];
        return window.KStyleUtils.storage.get('quizHistory', []);
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    handleError(error) {
        const container = document.getElementById('quiz-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="quiz-error">
                <h2>Unable to Load Quiz</h2>
                <p>We're having trouble loading the quiz questions. Please check your internet connection and try again.</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                <a href="../index.html" class="btn btn-outline">Return Home</a>
            </div>
        `;
    }
}

// Initialize quiz when DOM is loaded
let koreanQuiz;

document.addEventListener('DOMContentLoaded', () => {
    koreanQuiz = new KoreanQuiz();
});

// CSS for quiz styling
const quizStyles = `
    .quiz-categories {
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
    }
    
    .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    
    .category-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border: 1px solid #eee;
    }
    
    .quiz-question {
        max-width: 800px;
        margin: 0 auto;
    }
    
    .quiz-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
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
    
    .timer-value {
        font-weight: bold;
        font-size: 1.2rem;
    }
    
    .timer-warning {
        color: #e74c3c;
        animation: pulse 1s infinite;
    }
    
    .timer-caution {
        color: #f39c12;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .question-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .question-text {
        font-size: 1.3rem;
        margin-bottom: 1.5rem;
        line-height: 1.4;
    }
    
    .answer-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .answer-option {
        display: flex;
        align-items: center;
        padding: 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
    }
    
    .answer-option:hover {
        border-color: #4ecdc4;
        background: #f8fffe;
    }
    
    .answer-option.selected {
        border-color: #ff6b6b;
        background: #fff5f5;
    }
    
    .option-number {
        width: 30px;
        height: 30px;
        background: #6c757d;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
        font-weight: bold;
    }
    
    .answer-option.selected .option-number {
        background: #ff6b6b;
    }
    
    .quiz-results {
        max-width: 800px;
        margin: 0 auto;
        text-align: center;
    }
    
    .results-header {
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        color: white;
        padding: 2rem;
        border-radius: 8px;
        margin-bottom: 2rem;
    }
    
    .final-score {
        font-size: 3rem;
        font-weight: bold;
        margin: 1rem 0;
    }
    
    .score-percentage {
        font-size: 2rem;
        margin-bottom: 1rem;
    }
    
    .score-grade {
        font-size: 1.5rem;
        font-weight: bold;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        display: inline-block;
    }
    
    .grade-a { background: #2ecc71; }
    .grade-b { background: #3498db; }
    .grade-c { background: #f39c12; }
    .grade-d { background: #e67e22; }
    .grade-f { background: #e74c3c; }
    
    .question-review {
        text-align: left;
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 1rem;
    }
    
    .review-item {
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }
    
    .review-item.correct {
        background: #f8fff8;
        border-left: 4px solid #2ecc71;
    }
    
    .review-item.incorrect {
        background: #fff8f8;
        border-left: 4px solid #e74c3c;
    }
    
    .pause-overlay {
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
    
    .pause-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
    }
    
    @media (max-width: 768px) {
        .quiz-header {
            flex-direction: column;
            gap: 1rem;
        }
        
        .progress-bar {
            width: 100%;
        }
        
        .answer-options {
            gap: 0.5rem;
        }
        
        .answer-option {
            padding: 0.75rem;
        }
        
        .question-text {
            font-size: 1.1rem;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = quizStyles;
document.head.appendChild(styleSheet);
