/**
 * QUIZZES/HOTSPOT.JS — Логика для тестов с кликом по изображению
 * Добавлены режимы "множественный выбор" и "последовательность"
 */
QuizTypes.hotspot = {
    render(question) {
        let instructions = 'Кликните на правильную область изображения';
        if (question.type === 'hotspot-multiple') {
            instructions = 'Отметьте все правильные области на изображении';
        } else if (question.type === 'hotspot-sequence') {
            instructions = 'Кликните на правильные области в указанном порядке';
        }

        return `
            <figure id="hotspotContainer" class="figure position-relative d-inline-block">
                <img src="${question.image}" alt="Hotspot image" class="img-fluid d-block">
                <figcaption class="figure-caption text-center"><small>${instructions}</small></figcaption>
            </figure>
        `;
    },

    init(question, nextBtn, onAnswer) {
        const container = document.getElementById('hotspotContainer');
        const img = container.querySelector('img');
        let userClicks = [];

        img.onload = () => {
            container.style.width = `${img.offsetWidth}px`;
            container.style.height = `${img.offsetHeight}px`;
        };
        if (img.complete) {
            img.onload();
        }

        container.addEventListener('click', (e) => {
            const rect = img.getBoundingClientRect();
            const x = Math.round(((e.clientX - rect.left) / img.width) * 100);
            const y = Math.round(((e.clientY - rect.top) / img.height) * 100);
            
            userClicks.push({ x, y });
            onAnswer(userClicks); // Отправляем ответ после каждого клика

            // Визуальный фидбэк
            const marker = document.createElement('div');
            marker.className = 'hotspot-marker';
            marker.style.left = `${x}%`;
            marker.style.top = `${y}%`;

            if (question.type === 'hotspot-multiple' || question.type === 'hotspot-sequence') {
                marker.textContent = userClicks.length;
            }
            container.appendChild(marker);

        });
    },

    validate(question, userClicks) {
        if (!userClicks || userClicks.length === 0) return false;

        const isClickInZone = (click, zone) => 
            Math.sqrt(Math.pow(click.x - zone.x, 2) + Math.pow(click.y - zone.y, 2)) < zone.tolerance;

        if (question.type === 'hotspot') {
            return question.zones.some(zone => isClickInZone(userClicks[0], zone));
        } 
        
        if (question.type === 'hotspot-multiple') {
            if (userClicks.length !== question.zones.length) return false;
            // Проверяем, что каждый клик попадает в одну из уникальных зон
            const matchedZones = new Set();
            for (const click of userClicks) {
                const foundZone = question.zones.find((zone, index) => !matchedZones.has(index) && isClickInZone(click, zone));
                if (foundZone) {
                    matchedZones.add(question.zones.indexOf(foundZone));
                } else {
                    return false; // Лишний или неверный клик
                }
            }
            return matchedZones.size === question.zones.length;
        } 
        
        if (question.type === 'hotspot-sequence') {
            if (userClicks.length !== question.zones.length) return false;
            return userClicks.every((click, index) => isClickInZone(click, question.zones[index]));
        }

        return false;
    }
};
