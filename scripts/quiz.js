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
        const startBtn = document.getElementById('start-quiz-btn');
        if (startBtn) {
             startBtn.disabled = true;
        }

        // Category selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('.category-btn')) {
                const categoryId = e.target.dataset.categoryId;
                this.selectCategory(categoryId);
                if (startBtn) {
                     startBtn.disabled = false;
                }
            }
        });
        
        // Next button click
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.isQuizActive) {
                    this.nextQuestion();
                }
            });
        }
    
        // Answer selection
        document.getElementById('answer-options').addEventListener('click', (e) => {
            if (e.target.matches('.answer-option') && this.isQuizActive) {
                const selectedAnswer = e.target.dataset.option;
                this.checkAnswer(selectedAnswer);
            }
        });

        // Start button
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startQuiz();
            });
        }

        // Restart button
        const restartBtn = document.getElementById('restart-quiz-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartQuiz();
            });
        }
    }

    displayCategories() {
        const categoryContainer = document.getElementById('category-container');
        if (!categoryContainer) return;
        
        categoryContainer.innerHTML = '';
        if (this.categories.length === 0) {
            categoryContainer.innerHTML = `<p>No quiz categories available.</p>`;
            return;
        }

        this.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.dataset.categoryId = category.id;
            button.textContent = category.name;
            categoryContainer.appendChild(button);
        });
    }

    selectCategory(categoryId) {
        // Highlight the selected button
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('selected'));
        const selectedBtn = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }

        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            this.selectedCategory = category;
            document.querySelector('.quiz-category-title').textContent = this.selectedCategory.name;
            document.getElementById('quiz-intro').style.display = 'none';
            document.getElementById('quiz-container').style.display = 'block';
        }
    }

    startQuiz() {
        if (!this.selectedCategory) {
            return;
        }
        
        this.questions = this.selectedCategory.questions;
        this.questions = this.shuffleArray(this.questions);
        
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.isQuizActive = true;

        this.updateProgress();
        this.displayQuestion();
        this.startTimer();

        document.getElementById('quiz-start').style.display = 'none';
        document.getElementById('quiz-main').style.display = 'block';
        document.getElementById('quiz-result').style.display = 'none';
    }

    displayQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endQuiz();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        document.getElementById('question-text').textContent = question.text;
        
        const optionsContainer = document.getElementById('answer-options');
        optionsContainer.innerHTML = '';
        
        const shuffledOptions = this.shuffleArray(question.options);
        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.className = 'answer-option';
            button.dataset.option = option;
            button.textContent = option;
            optionsContainer.appendChild(button);
        });
        
        document.getElementById('feedback').textContent = '';
        this.updateProgress();
        this.resetTimer();
    }

    checkAnswer(selectedOption) {
        if (!this.isQuizActive) return;
        
        const currentQuestion = this.questions[this.currentQuestionIndex];
        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        this.answers.push({
            question: currentQuestion.text,
            userAnswer: selectedOption,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: isCorrect
        });
        
        if (isCorrect) {
            this.score++;
        }
        
        this.stopTimer();
        this.showFeedback(isCorrect);
    }
    
    showFeedback(isCorrect) {
        const feedbackDiv = document.getElementById('feedback');
        if (isCorrect) {
            feedbackDiv.textContent = "Correct!";
            feedbackDiv.className = 'correct';
        } else {
            feedbackDiv.textContent = "Incorrect. The correct answer was: " + this.questions[this.currentQuestionIndex].correctAnswer;
            feedbackDiv.className = 'incorrect';
        }
        document.getElementById('next-btn').style.display = 'block';
    }

    nextQuestion() {
        document.getElementById('next-btn').style.display = 'none';
        this.currentQuestionIndex++;
        this.displayQuestion();
        this.startTimer();
    }

    endQuiz() {
        this.isQuizActive = false;
        this.stopTimer();
        document.getElementById('quiz-main').style.display = 'none';
        document.getElementById('quiz-result').style.display = 'block';
        
        document.getElementById('score-display').textContent = `${this.score} / ${this.questions.length}`;
        this.displayReview();
    }

    displayReview() {
        const reviewContainer = document.getElementById('review-container');
        reviewContainer.innerHTML = '';
        
        this.answers.forEach(answer => {
            const reviewItem = document.createElement('div');
            reviewItem.className = `review-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;
            reviewItem.innerHTML = `
                <p><strong>Question:</strong> ${answer.question}</p>
                <p><strong>Your Answer:</strong> ${answer.userAnswer}</p>
                <p><strong>Correct Answer:</strong> ${answer.correctAnswer}</p>
            `;
            reviewContainer.appendChild(reviewItem);
        });
    }

    restartQuiz() {
        document.getElementById('quiz-result').style.display = 'none';
        document.getElementById('quiz-intro').style.display = 'block';
        document.getElementById('quiz-container').style.display = 'none';
    }

    updateProgress() {
        const progressDisplay = document.getElementById('progress-display');
        progressDisplay.textContent = `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
    }

    startTimer() {
        this.timeLeft = this.timeLimit;
        const timerDisplay = document.getElementById('timer-display');
        timerDisplay.textContent = this.timeLeft;

        this.timer = setInterval(() => {
            this.timeLeft--;
            timerDisplay.textContent = this.timeLeft;
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.checkAnswer('time-up');
            }
        }, 1000);
    }

    resetTimer() {
        this.stopTimer();
        document.getElementById('timer-display').textContent = this.timeLimit;
    }

    stopTimer() {
        clearInterval(this.timer);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    handleError(error) {
        document.getElementById('quiz-intro').style.display = 'none';
        document.getElementById('quiz-container').innerHTML = `
            <div class="error-message-container">
                <p>Error loading quiz data. Please check your internet connection and the 'quiz-questions.json' file.</p>
                <p>Details: ${error.message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KoreanQuiz();
});