/**
 * QUIZZES.JS — Центральный модуль для тестов
 * Определяет тип теста и вызывает нужный модуль для рендеринга и обработки
 */
const Quizzes = {
    currentQuiz: null,
    currentQuestionIndex: 0,
    userAnswers: [],
    startTime: null,
    timerInterval: null,
    onCompleteCallback: null,
  
    render(quiz, onComplete) {
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        alert('Ошибка: тест не содержит вопросов.');
        return;
      }
  
      this.currentQuiz = quiz;
      this.currentQuestionIndex = 0;
      this.userAnswers = [];
      this.startTime = Date.now();
      this.onCompleteCallback = onComplete;
      
      this.userAnswers = new Array(quiz.questions.length).fill(null);
      this.renderQuestion();
    },
  
    renderQuestion() {
        const quiz = this.currentQuiz;
        const question = quiz.questions[this.currentQuestionIndex];
        const app = document.getElementById('app');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        let html = `
            <header class="page-header">
                <hgroup>
                  <h2>${quiz.title}</h2>
                  <p>Вопрос ${this.currentQuestionIndex + 1} из ${quiz.questions.length}</p>
                </hgroup>
                ${quiz.timeLimit > 0 ? `<div id="timer" class="quiz-timer">${quiz.timeLimit} сек</div>` : ''}
            </header>
            <article id="quizContent">
                <header>
                    <h3>${question.question || question.text}</h3>
                </header>
                <div id="questionContainer"></div>
                <footer>
                    <div class="d-grid">
                        <a href="#" class="btn btn-primary w-100" id="nextBtn" aria-disabled="true">${this.currentQuestionIndex === quiz.questions.length - 1 ? 'Завершить тест' : 'Далее'}</a>
                    </div>
                </footer>
            </article>
        `;
        app.innerHTML = html;
  
        const questionContainer = document.getElementById('questionContainer');
        const questionType = question.type.split('-')[0]; // Handle variants like hotspot-multiple
  
        if (QuizTypes[questionType] && QuizTypes[questionType].render) {
            questionContainer.innerHTML = QuizTypes[questionType].render(question);
        } else {
            questionContainer.innerHTML = '<p>Неизвестный тип вопроса.</p>';
        }
  
        this.initQuestionInteractions(question);
  
        if (quiz.timeLimit > 0) {
            this.startTimer(quiz.timeLimit);
        }
    },
  
    initQuestionInteractions(question) {
        const nextBtn = document.getElementById('nextBtn');
        const questionType = question.type.split('-')[0];
  
        const onAnswerCallback = (answer) => {
            this.userAnswers[this.currentQuestionIndex] = answer;
            nextBtn.removeAttribute('aria-disabled');
        };
  
        if (QuizTypes[questionType] && QuizTypes[questionType].init) {
            QuizTypes[questionType].init(question, nextBtn, onAnswerCallback);
        }
  
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (nextBtn.getAttribute('aria-disabled') === 'true') return;
  
            if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
                this.currentQuestionIndex++;
                this.renderQuestion();
            } else {
                // Ensure the "Завершить тест" button is enabled before finishing
                const nextBtn = document.getElementById('nextBtn');
                if (nextBtn) {
                    nextBtn.removeAttribute('aria-disabled');
                }
                this.finishQuiz();
            }
        });
    },
  
    cancelQuiz() {
        if (Core.state.currentCourseId && Core.state.currentLessonId) {
            Core.setView('lesson', { currentCourseId: Core.state.currentCourseId, currentLessonId: Core.state.currentLessonId });
        } else if (Core.state.currentCourseId) {
            Core.setView('course', { currentCourseId: Core.state.currentCourseId });
        } else {
            Core.setView('home');
        }
    },
  
    startTimer(seconds) {
        let remaining = seconds;
        const timerElement = document.getElementById('timer');
        
        this.timerInterval = setInterval(() => {
            remaining--;
            if (timerElement) {
              timerElement.textContent = `${remaining} сек`;
            }
            
            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                this.finishQuiz();
            }
        }, 1000);
    },
  
    finishQuiz() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        const quiz = this.currentQuiz;
        let totalCorrect = 0;
        
        quiz.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const questionType = question.type.split('-')[0];
  
            if (!question.type || !QuizTypes[questionType] || !QuizTypes[questionType].validate) {
                console.error(`Ошибка: Неизвестный или неопределенный тип вопроса: ${question.type}`, question);
                return; // Пропускаем этот вопрос
            }
  
            if (QuizTypes[questionType].validate(question, userAnswer)) {
                totalCorrect++;
            }
        });
        
        const finalScore = (totalCorrect / quiz.questions.length) * 100;
  
        const result = {
            score: Math.round(finalScore),
            passed: finalScore >= quiz.passingScore,
            answers: [...this.userAnswers],
            timeSpent: Date.now() - this.startTime
        };
        
        if (this.onCompleteCallback) {
            this.onCompleteCallback(result);
        }
    }
  };
  
  const QuizTypes = {};
  