// quiz.js 전체 수정본

// 전역 변수
let currentQuestion = 0;
let score = 0;
let selectedCategory = "";

// DOM 요소
const quizIntro = document.getElementById('quiz-intro');
const quizMain = document.getElementById('quiz-main');
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const scoreEl = document.getElementById('score');
const resultEl = document.getElementById('result');
const nextBtn = document.getElementById('next-btn');

// 퀴즈 데이터 예시 (카테고리별로)
const quizData = {
    general: [
        {
            question: "첫 번째 질문 예시",
            answers: ["A", "B", "C", "D"],
            correct: "A"
        },
        {
            question: "두 번째 질문 예시",
            answers: ["A", "B", "C", "D"],
            correct: "B"
        }
    ],
    // 다른 카테고리 추가 가능
};

// 카테고리 선택
function selectCategory(category) {
    selectedCategory = category;
    currentQuestion = 0;
    score = 0;

    // Intro 숨기기
    quizIntro.style.display = 'none';

    // Main 퀴즈 화면 보여주기
    quizMain.style.display = 'block';

    showQuestion();
}

// 질문 표시
function showQuestion() {
    const current = quizData[selectedCategory][currentQuestion];
    questionEl.textContent = current.question;

    // 기존 답변 제거
    answersEl.innerHTML = '';

    current.answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.textContent = answer;
        btn.className = 'answer-btn';
        btn.addEventListener('click', () => selectAnswer(answer));
        answersEl.appendChild(btn);
    });
}

// 답 선택 처리
function selectAnswer(answer) {
    const current = quizData[selectedCategory][currentQuestion];
    if (answer === current.correct) score++;

    nextBtn.style.display = 'block';
}

// 다음 질문
nextBtn.addEventListener('click', () => {
    currentQuestion++;
    nextBtn.style.display = 'none';

    if (currentQuestion < quizData[selectedCategory].length) {
        showQuestion();
    } else {
        showResult();
    }
});

// 결과 표시
function showResult() {
    quizMain.style.display = 'none';
    resultEl.style.display = 'block';
    scoreEl.textContent = `당신의 점수: ${score} / ${quizData[selectedCategory].length}`;
}

// 초기 실행 시 Intro 보여주기
quizIntro.style.display = 'block';
quizMain.style.display = 'none';
resultEl.style.display = 'none';
