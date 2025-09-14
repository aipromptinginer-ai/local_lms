/**
 * QUIZZES/TRUEFALSE.JS — Логика для тестов "Верно/Неверно"
 */
QuizTypes.truefalse = {
    render(question) {
        return `
            <fieldset class="mb-3">
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" id="true_option" name="answer" value="true">
                    <label class="form-check-label" for="true_option">
                        Верно
                    </label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" id="false_option" name="answer" value="false">
                    <label class="form-check-label" for="false_option">
                        Неверно
                    </label>
                </div>
            </fieldset>
        `;
    },

    init(question, nextBtn, onAnswer) {
        const radios = document.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                onAnswer(radio.value === 'true');
            });
        });
    },

    validate(question, userAnswer) {
        const isCorrectAnswerTrue = question.correct[0] === 0;
        return isCorrectAnswerTrue === userAnswer;
    }
};
