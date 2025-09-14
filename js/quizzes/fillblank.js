/**
 * QUIZZES/FILLBLANK.JS — Логика для тестов с заполнением пропусков
 */
QuizTypes.fillblank = {
    render(question) {
        return `
            <div>
                <p>${question.text.replace('___', '<input type="text" class="form-control d-inline-block w-auto" id="fillBlankInput" placeholder="Введите ответ">')}</p>
            </div>
        `;
    },

    init(question, nextBtn, onAnswer) {
        const input = document.getElementById('fillBlankInput');
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                onAnswer(input.value.trim());
            }
        });
    },

    validate(question, userAnswer) {
        if (!userAnswer) return false;
        const correctAnswers = question.correctAnswers.map(a => a.toLowerCase());
        return correctAnswers.includes(userAnswer.toLowerCase());
    }
};
