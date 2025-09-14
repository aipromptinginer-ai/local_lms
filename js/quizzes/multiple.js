/**
 * QUIZZES/MULTIPLE.JS — Логика для тестов с несколькими правильными ответами
 */
QuizTypes.multiple = {
    render(question) {
        const options = [...question.options].sort(() => Math.random() - 0.5);
        let html = '<fieldset class="mb-3">';
        options.forEach((option, index) => {
            html += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="option_${index}" name="answer" value="${option}">
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
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selected = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                onAnswer(selected);
            });
        });
    },

    validate(question, userAnswers) {
        if (!userAnswers || userAnswers.length !== question.correct.length) {
            return false;
        }
        // Создаем множество правильных ответов для быстрой проверки
        const correctSet = new Set(question.correct.map(index => question.options[index]));
        // Проверяем, что каждый ответ пользователя есть в множестве правильных
        return userAnswers.every(answer => correctSet.has(answer));
    }
};
