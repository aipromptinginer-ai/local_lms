/**
 * QUIZZES/SEQUENCE.JS — Логика для тестов на последовательность
 */
QuizTypes.sequence = {
    render(question) {
        // Создаем массив объектов для сохранения исходного индекса
        const steps = question.steps.map((step, index) => ({ text: step, originalIndex: index }))
            .sort(() => Math.random() - 0.5); // Перемешиваем
        
        let html = `
            <p class="text-muted"><small>Перетащите элементы, чтобы расставить их в правильном порядке.</small></p>
            <div id="sequenceContainer" class="d-flex flex-column gap-2">
        `;
        
        steps.forEach((stepObj) => {
            html += `
                <a href="#" draggable="true" data-index="${stepObj.originalIndex}" class="btn btn-outline-secondary text-start">
                    ${stepObj.text}
                </a>
            `;
        });
        
        html += `</div>`;
        return html;
    },

    init(question, nextBtn, onAnswer) {
        const container = document.getElementById('sequenceContainer');
        let draggedItem = null;

        container.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            e.target.style.opacity = '0.5';
        });

        container.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
            draggedItem = null;

            // После перетаскивания собираем новый порядок и отправляем ответ
            const newOrder = Array.from(container.children).map(el => parseInt(el.dataset.index));
            onAnswer(newOrder);
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }
        });
    },

    // Вспомогательная функция для определения, куда вставить перетаскиваемый элемент
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.sequence-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    validate(question, userOrder) {
        if (!userOrder || userOrder.length !== question.steps.length) return false;
        // Правильный порядок - это просто последовательность индексов от 0 до N-1
        const correctOrder = question.steps.map((_, index) => index);
        return JSON.stringify(userOrder) === JSON.stringify(correctOrder);
    }
};
