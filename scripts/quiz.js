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
            const response = await fetch('../data/quiz-questions.json'); 
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
        const answerOptionsContainer = document.getElementById('answer-options');
        if (answerOptionsContainer) {
            answerOptionsContainer.addEventListener('click', (e) => {
                if (e.target.matches('.answer-option') && this.isQuizActive) {
                    const selectedAnswer = e.target.dataset.option;
                    this.checkAnswer(selectedAnswer);
                }
            });
        }
    
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
            button.textContent = category.name;
            button.dataset.categoryId = category.id;
            
            button.addEventListener('click', () => {
                // Remove 'selected' class from all buttons
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                // Add 'selected' class to the clicked button
                button.classList.add('selected');

                this.selectCategory(category.id);
                const startBtn = document.getElementById('start-quiz-btn');
                if (startBtn) {
                     startBtn.disabled = false;
                }
            });

            categoryContainer.appendChild(button);
        });
    }

    selectCategory(categoryId) {
        this.selectedCategory = this.categories.find(cat => cat.id === categoryId);
        if (this.selectedCategory) {
            this.questions = this.shuffleArray([...this.selectedCategory.questions]);
            console.log(`Selected category: ${this.selectedCategory.name}`);
        }
    }

    startQuiz() {
        if (!this.selectedCategory) {
            alert("Please select a quiz category first.");
            return;
        }
        this.isQuizActive = true;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        document.getElementById('quiz-intro').style.display = 'none';
        document.getElementById('quiz-question-view').style.display = 'block';
        this.showQuestion();
    }
    
    showQuestion() {
        this.resetTimer();
        const currentQuestion = this.questions[this.currentQuestionIndex];
        if (!currentQuestion) {
            this.endQuiz();
            return;
        }

        document.getElementById('question-text').textContent = currentQuestion.text;
        const answerOptions = document.getElementById('answer-options');
        answerOptions.innerHTML = '';
        
        // Shuffle options for each question
        const shuffledOptions = this.shuffleArray([...currentQuestion.options]);
        
        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.className = 'answer-option';
            button.textContent = option;
            button.dataset.option = option;
            answerOptions.appendChild(button);
        });

        this.updateQuestionCounter();
        this.startTimer();
    }
    
    checkAnswer(selectedOption) {
        if (!this.isQuizActive) return;
        
        this.stopTimer();
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
        
        // Show immediate feedback
        const feedbackContainer = document.getElementById('feedback-container');
        if (isCorrect) {
            feedbackContainer.innerHTML = `<p class="correct-feedback">✅ Correct! The answer is ${currentQuestion.correctAnswer}.</p>`;
        } else {
            feedbackContainer.innerHTML = `<p class="incorrect-feedback">❌ Incorrect. The correct answer was ${currentQuestion.correctAnswer}.</p>`;
        }
        
        // Disable answer buttons after selection
        document.querySelectorAll('.answer-option').forEach(btn => btn.disabled = true);
        
        // Wait a moment before moving to the next question
        setTimeout(() => {
            feedbackContainer.innerHTML = ''; // Clear feedback
            this.nextQuestion();
        }, 1500);
    }

    nextQuestion() {
        if (!this.isQuizActive) return;
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.endQuiz();
        }
    }
    
    endQuiz() {
        this.isQuizActive = false;
        this.stopTimer();
        document.getElementById('quiz-question-view').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'block';

        const resultText = document.getElementById('result-text');
        const totalQuestions = this.questions.length;
        const resultPercentage = Math.round((this.score / totalQuestions) * 100);
        resultText.innerHTML = `You scored ${this.score} out of ${totalQuestions} (${resultPercentage}%)`;
        
        // Display answer breakdown
        const breakdownList = document.getElementById('breakdown-list');
        breakdownList.innerHTML = '';
        this.answers.forEach(answer => {
            const listItem = document.createElement('li');
            listItem.className = answer.isCorrect ? 'correct-answer-item' : 'incorrect-answer-item';
            listItem.innerHTML = `
                <strong>Q:</strong> ${answer.question}<br>
                <strong>Your Answer:</strong> ${answer.userAnswer}<br>
                <strong>Correct Answer:</strong> ${answer.correctAnswer}
            `;
            breakdownList.appendChild(listItem);
        });
    }

    restartQuiz() {
        document.getElementById('quiz-results').style.display = 'none';
        document.getElementById('quiz-intro').style.display = 'block';
        const startBtn = document.getElementById('start-quiz-btn');
        if (startBtn) {
            startBtn.disabled = true;
        }
        this.selectedCategory = null;
    }

    updateQuestionCounter() {
        const counterElement = document.getElementById('question-counter');
        if (!counterElement) return;
        counterElement.textContent = `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
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
                <p>Error loading quiz data. Please check your internet connection and the 'quiz-questions.json' file path.</p>
                <p>Details: ${error.message}</p>
            </div>
        `;
        console.error("Quiz initialization error:", error);
    }
}

// Instantiate the quiz
document.addEventListener('DOMContentLoaded', () => {
    new KoreanQuiz();
});