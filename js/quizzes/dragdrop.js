/**
 * QUIZZES/DRAGDROP.JS — Логика для тестов Drag & Drop
 * Добавлен режим "по категориям"
 */
QuizTypes.dragdrop = {
  render(question) {
    let html = '<div class="row g-4">';
    
    if (question.type === 'dragdrop') {
      const items = [...question.items].sort(() => Math.random() - 0.5);
      const targets = [...question.targets];
      
      html += `
        <div class="col-md-6">
          <h6>Перетащите элементы</h6>
          <div id="dragItems" class="drag-container d-flex flex-wrap gap-2 p-3 border rounded bg-light">
            ${items.map((item) => `
              <a href="#" draggable="true" data-item="${item}" class="btn btn-outline-secondary">${item}</a>
            `).join('')}
          </div>
        </div>
        <div class="col-md-6">
          <h6>На соответствующие цели</h6>
          <div id="dropTargets">
            ${targets.map((target) => `
              <div class="card mb-3 drop-target">
                  <div class="card-header">${target}</div>
                  <div class="card-body drop-zone p-3" style="min-height: 50px;"></div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (question.type === 'dragdrop-categories') {
      const items = [...question.items].sort(() => Math.random() - 0.5);
      const categories = question.categories;
      
      html += `
        <div class="col-md-6">
          <h6>Перетащите элементы</h6>
          <div id="dragItems" class="drag-container d-flex flex-wrap gap-2 p-3 border rounded bg-light">
            ${items.map((item) => `
              <a href="#" draggable="true" data-item="${item}" class="btn btn-outline-secondary">${item}</a>
            `).join('')}
          </div>
        </div>
        <div class="col-md-6">
          <h6>Распределите по категориям</h6>
          <div id="dropCategories">
            ${categories.map((category) => `
              <div class="card mb-3 drop-target">
                <div class="card-header">${category.name}</div>
                <div class="card-body drop-zone p-3" style="min-height: 80px;"></div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  },

  init(question, nextBtn, onAnswer) {
      let userAnswers = {};
      const dragItems = document.querySelectorAll('#dragItems [draggable]');
      const allItemsCount = dragItems.length;
      let draggedItem = null;

      dragItems.forEach(item => {
          item.addEventListener('dragstart', (e) => {
              draggedItem = e.target;
              e.dataTransfer.setData('text/plain', e.target.dataset.item);
              setTimeout(() => {
                  e.target.style.display = 'none';
              }, 0);
          });
          item.addEventListener('dragend', (e) => {
              setTimeout(() => {
                  if (draggedItem) {
                      draggedItem.style.display = 'block';
                      draggedItem = null;
                  }
              }, 0);
          });
      });

      const dropZones = document.querySelectorAll('.drop-zone');
      dropZones.forEach(zone => {
          zone.addEventListener('dragover', (e) => {
              e.preventDefault();
              zone.closest('.drop-target').classList.add('drag-over');
          });
          zone.addEventListener('dragleave', (e) => {
              zone.closest('.drop-target').classList.remove('drag-over');
          });
          zone.addEventListener('drop', (e) => {
              e.preventDefault();
              zone.closest('.drop-target').classList.remove('drag-over');
              const itemText = e.dataTransfer.getData('text/plain');
              const targetText = zone.closest('[data-target]')?.dataset.target || zone.closest('[data-category]')?.dataset.category;
              
              if (draggedItem) {
                  zone.appendChild(draggedItem);
                  userAnswers[itemText] = targetText;
                  onAnswer(userAnswers);
                  
                  if (Object.keys(userAnswers).length === allItemsCount) {
                      onAnswer(userAnswers); // Trigger final answer
                  }
              }
          });
      });
  },

  validate(question, userAnswers) {
      if (!userAnswers || Object.keys(userAnswers).length < question.items.length) return false;

      if (question.type === 'dragdrop') {
          const correctMappings = question.mappings.reduce((acc, m) => {
              acc[m.item] = m.target;
              return acc;
          }, {});
          return JSON.stringify(userAnswers) === JSON.stringify(correctMappings);
      } else if (question.type === 'dragdrop-categories') {
          const correctCategoryMap = {};
          question.categories.forEach(cat => {
              cat.correctItems.forEach(item => {
                  correctCategoryMap[item] = cat.name;
              });
          });

          for (const item in userAnswers) {
              if (userAnswers[item] !== correctCategoryMap[item]) {
                  return false;
              }
          }
          return true;
      }
      return false;
  }
};
