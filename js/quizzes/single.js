/**
 * QUIZZES/SINGLE.JS — Логика для тестов с одним правильным ответом
 */
QuizTypes.single = {
    render(question) {
        const options = [...(question.options || [])].sort(() => Math.random() - 0.5);
        let html = '<fieldset class="mb-3">';
        options.forEach((option, index) => {
            html += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" id="option_${index}" name="answer" value="${option}">
                    <label class="form-check-label" for="option_${index}">
                        ${option}
                    </label>
                </div>
            `;
        });
        html += '</fieldset>';
        return html;
    },

    init(question, nextBtn, onAnswer) {
        const radios = document.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                onAnswer(radio.value);
            });
        });
    },

    validate(question, userAnswer) {
        return question.options[question.correct[0]] === userAnswer;
    }
};
