/**
 * ADMIN/QUIZZES.JS — Модуль управления тестами
 * Отвечает за: рендеринг вкладки, создание, редактирование и удаление тестов
 */
const AdminQuizzes = {
  state: {
    editingQuiz: null,
    currentCategoryFilter: '',
  },
  
  renderTab() {
    const quizzes = Storage.getQuizzes();
    const categories = [...new Set(quizzes.map(quiz => quiz.category).filter(Boolean))];

    let categoryOptionsHtml = '<option value="">Все категории</option>';
    categories.forEach(category => {
      categoryOptionsHtml += `<option value="${category}" ${this.state.currentCategoryFilter === category ? 'selected' : ''}>${category}</option>`;
    });

    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2>Управление тестами</h2>
              <p class="text-muted">Создавайте и настраивайте тесты для проверки знаний.</p>
          </div>
          <div class="d-flex gap-2 align-items-center">
              <select id="quizCategoryFilter" class="form-select">
                ${categoryOptionsHtml}
              </select>
              <a href="#" class="btn btn-primary" onclick="event.preventDefault(); AdminQuizzes.createQuiz()">+ Создать тест</a>
          </div>
      </div>
    `;

    const filteredQuizzes = this.state.currentCategoryFilter
      ? quizzes.filter(quiz => quiz.category === this.state.currentCategoryFilter)
      : quizzes;

    if (filteredQuizzes.length === 0) {
      html += `<div class="alert alert-info">Нет тестов. Создайте первый тест.</div>`;
    } else {
      filteredQuizzes.forEach(quiz => {
        html += `
          <div class="card mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="card-title">${quiz.title}</h5>
                  <p class="card-text text-muted">Категория: ${quiz.category || 'Не указана'}</p>
                  <div class="row row-cols-2 g-2 mt-2">
                    <div class="col"><small class="text-muted">Вопросов: ${quiz.questions?.length || 0}</small></div>
                    <div class="col"><small class="text-muted">Проходной балл: ${quiz.passingScore || 80}%</small></div>
                    <div class="col"><small class="text-muted">Попыток: ${quiz.maxAttempts === 0 ? '∞' : quiz.maxAttempts}</small></div>
                    <div class="col"><small class="text-muted">Таймер: ${quiz.timeLimit > 0 ? quiz.timeLimit + ' сек' : 'Нет'}</small></div>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <a href="#" class="btn btn-outline-secondary btn-sm" onclick="event.preventDefault(); AdminQuizzes.editQuiz('${quiz.id}')">Редактировать</a>
                  <a href="#" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); AdminQuizzes.deleteQuiz('${quiz.id}')">Удалить</a>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }

    html += `
      <div class="card mt-4">
        <div class="card-body">
          <h5 class="card-title">Экспорт/Импорт</h5>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" onclick="Storage.exportQuizzes()">Экспорт тестов (JSON)</button>
            <button class="btn btn-secondary" onclick="AdminQuizzes.importQuizzes()">Импорт тестов (JSON)</button>
          </div>
        </div>
      </div>
    `;

    return html; 
  },

  initEventListeners() {
      const filter = document.getElementById('quizCategoryFilter');
      if (filter) {
          filter.addEventListener('change', (e) => {
              this.state.currentCategoryFilter = e.target.value;
              Admin.render();
          });
      }
  },

  getQuizTypeLabel(type, getAll = false) {
    const labels = {
      'single': 'Один правильный ответ',
      'multiple': 'Несколько правильных ответов',
      'truefalse': 'Верно/Неверно',
      'fillblank': 'Заполнение пропусков',
      'sequence': 'Установление последовательности',
      'dragdrop': 'Перетаскивание (сопоставление)',
      'hotspot': 'Клик по изображению'
    };
    if (getAll) return labels;
    return labels[type] || type;
  },

  createQuiz() {
    this.state.editingQuiz = {
      id: Storage.generateId('quiz'),
      title: '',
      category: '',
      questions: [],
      maxScore: 100,
      timeLimit: 0,
      maxAttempts: 3,
      passingScore: 80,
      shuffle: true
    };
    this.editQuiz(this.state.editingQuiz.id);
  },

  editQuiz(quizId) {
    const quiz = Storage.getQuizzes().find(q => q.id === quizId) || this.state.editingQuiz;
    this.state.editingQuiz = quiz;
    const app = document.getElementById('app');
    
    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2>${quiz.title ? 'Редактирование теста' : 'Создание теста'}</h2>
              <p class="text-muted">Настройте параметры теста и добавьте вопросы.</p>
          </div>
          <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); Admin.setTab('quizzes')">← Назад</a>
      </div>
      <div class="card">
        <div class="card-body">
          <form id="quizForm">
            <div class="mb-3">
              <label for="quizTitle" class="form-label">Название теста *</label>
              <input type="text" class="form-control" id="quizTitle" value="${quiz.title}" required>
            </div>
            <div class="mb-3">
              <label for="quizCategory" class="form-label">Категория</label>
              <input type="text" class="form-control" id="quizCategory" value="${quiz.category || ''}" placeholder="Пожарная безопасность, HR и т.д.">
            </div>
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <label for="quizMaxScore" class="form-label">Макс. балл</label>
                    <input type="number" class="form-control" id="quizMaxScore" value="${quiz.maxScore || 100}" min="1">
                </div>
                <div class="col-md-6">
                    <label for="quizPassingScore" class="form-label">Проходной балл (%)</label>
                    <input type="number" class="form-control" id="quizPassingScore" value="${quiz.passingScore || 80}" min="0" max="100">
                </div>
            </div>
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <label for="quizMaxAttempts" class="form-label">Макс. попыток (0 = ∞)</label>
                    <input type="number" class="form-control" id="quizMaxAttempts" value="${quiz.maxAttempts || 3}" min="0">
                </div>
                <div class="col-md-6">
                    <label for="quizTimeLimit" class="form-label">Таймер (сек, 0 = ∞)</label>
                    <input type="number" class="form-control" id="quizTimeLimit" value="${quiz.timeLimit || 0}" min="0">
                </div>
            </div>
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" id="quizShuffle" ${quiz.shuffle ? 'checked' : ''}>
              <label class="form-check-label" for="quizShuffle">Перемешивать вопросы и варианты</label>
            </div>
            <hr>
            
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h3>Вопросы</h3>
              <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); AdminQuizzes.createQuestion()">+ Добавить вопрос</a>
            </div>
            <div id="questionsContainer">
    `;
    
    (quiz.questions || []).forEach((question, index) => {
        html += `
          <div class="list-group mb-3">
            <div class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                  <h6 class="mb-1">Вопрос #${index + 1} (${this.getQuizTypeLabel(question.type)})</h6>
                  <small class="text-muted">${(question.text || 'Без текста').substring(0, 100)}...</small>
              </div>
              <div class="d-flex gap-2">
                  <a href="#" class="btn btn-outline-secondary btn-sm" onclick="event.preventDefault(); AdminQuizzes.editQuestion(${index})">Редактировать</a>
                  <a href="#" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); AdminQuizzes.deleteQuestion(${index})">×</a>
              </div>
            </div>
          </div>
        `;
    });

    html += `
          <div class="d-flex gap-2 justify-content-end mt-4">
              <button type="submit" class="btn btn-primary">Сохранить тест</button>
              <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); Admin.setTab('quizzes')">Отмена</a>
          </div>
        </form>
        </div>
      </div>
    `;

    app.innerHTML = html;

    document.getElementById('quizForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveQuizDetails();
      Admin.setTab('quizzes');
    });
  },

  saveQuizDetails() {
    const quiz = this.state.editingQuiz;
    if (!quiz) return;

    quiz.title = document.getElementById('quizTitle').value.trim();
    quiz.category = document.getElementById('quizCategory').value.trim();
    quiz.maxScore = parseInt(document.getElementById('quizMaxScore').value) || 100;
    quiz.passingScore = parseInt(document.getElementById('quizPassingScore').value) || 80;
    quiz.maxAttempts = parseInt(document.getElementById('quizMaxAttempts').value) || 0;
    quiz.timeLimit = parseInt(document.getElementById('quizTimeLimit').value) || 0;
    quiz.shuffle = document.getElementById('quizShuffle').checked;
    
    Storage.saveQuiz(quiz);
  },
  
  createQuestion() {
    if (!this.state.editingQuiz) return;
    this.saveQuizDetails();

    const newQuestion = { type: 'single', text: '' }; 
    if (!this.state.editingQuiz.questions) {
      this.state.editingQuiz.questions = [];
    }
    this.state.editingQuiz.questions.push(newQuestion);
    
    this.editQuestion(this.state.editingQuiz.questions.length - 1);
  },

  editQuestion(questionIndex) {
    if (!this.state.editingQuiz) return;
    const quiz = this.state.editingQuiz;
    const question = quiz.questions[questionIndex];
    const app = document.getElementById('app');

    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2>${question.text ? 'Редактирование' : 'Создание'} вопроса #${questionIndex + 1}</h2>
              <p class="text-muted">Выберите тип вопроса и заполните его содержание.</p>
          </div>
          <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); AdminQuizzes.editQuiz('${quiz.id}')">← Назад к тесту</a>
      </div>
      <div class="card">
        <div class="card-body">
          <form id="questionForm">
            <div class="mb-3">
              <label for="questionType" class="form-label">Тип вопроса *</label>
              <select id="questionType" class="form-select" required>
    `;
    
    const allTypes = this.getQuizTypeLabel(null, true);
    for(const type in allTypes) {
        html += `<option value="${type}" ${question.type === type ? 'selected' : ''}>${allTypes[type]}</option>`;
    }

    html += `
            </select>
          </label>
          <div id="dynamic-fields">
            ${this.renderQuestionFields(question)}
          </div>
          <div class="d-flex gap-2 justify-content-end mt-4">
              <button type="submit" class="btn btn-primary">Сохранить вопрос</button>
              <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); AdminQuizzes.editQuiz('${quiz.id}')">Отмена</a>
          </div>
        </form>
        </div>
      </div>
    `;

    app.innerHTML = html;

    document.getElementById('questionType').addEventListener('change', (e) => {
        const newType = e.target.value;
        const textInput = document.querySelector('#dynamic-fields textarea');
        const currentText = textInput ? textInput.value : question.text;

        quiz.questions[questionIndex] = { 
            type: newType, 
            text: currentText || ''
        };
        
        this.editQuestion(questionIndex);
    });

    document.getElementById('questionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedQuestion = this.collectQuestionData(document.getElementById('questionType').value);
        quiz.questions[questionIndex] = updatedQuestion;
        Storage.saveQuiz(quiz);
        this.editQuiz(quiz.id);
    });
  },
  
  renderQuestionFields(question) {
    let fieldsHtml = '';
    const mainTextInputId = 'questionText'; 
    
    fieldsHtml += `
      <div class="mb-3">
        <label for="${mainTextInputId}" class="form-label">
          Текст вопроса/инструкция *
          <textarea class="form-control" id="${mainTextInputId}" rows="2" required>${question.text || ''}</textarea>
        </label>
      </div>
    `;

    switch (question.type) {
        case 'single':
        case 'multiple':
        case 'truefalse':
          fieldsHtml += this.renderOptionsFields(question);
          break;
        case 'fillblank':
          fieldsHtml += this.renderFillBlankFields(question);
          break;
        case 'sequence':
          fieldsHtml += this.renderSequenceFields(question);
          break;
        case 'dragdrop':
          fieldsHtml += this.renderDragDropFields(question);
          break;
        case 'hotspot':
          fieldsHtml += this.renderHotspotFields(question);
          break;
    }
    return fieldsHtml;
  },

  collectQuestionData(type) {
      let data = { 
        type: type,
        text: document.getElementById('questionText').value.trim() 
      };

      switch (type) {
          case 'single':
          case 'multiple':
          case 'truefalse':
            Object.assign(data, this.collectOptionsData());
            break;
          case 'fillblank':
            Object.assign(data, this.collectFillBlankData());
            break;
          case 'sequence':
            Object.assign(data, this.collectSequenceData());
            break;
          case 'dragdrop':
            Object.assign(data, this.collectDragDropData());
            break;
          case 'hotspot':
            Object.assign(data, this.collectHotspotData());
            break;
      }
      return data;
  },
  
  deleteQuestion(questionIndex) {
    if (!this.state.editingQuiz) return;
    const quiz = this.state.editingQuiz;
    if (confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      quiz.questions.splice(questionIndex, 1);
      Storage.saveQuiz(quiz);
      this.editQuiz(quiz.id);
    }
  },
  
  // --- Methods for SINGLE, MULTIPLE, TRUEFALSE ---
  renderOptionsFields(question) {
    let html = `<fieldset id="optionsContainer"><legend>Варианты ответов</legend>`;
    const options = question.type === 'truefalse' ? ['Верно', 'Неверно'] : (question.options || ['','']);
    const correct = question.correct || [];
    const inputType = question.type === 'single' || question.type === 'truefalse' ? 'radio' : 'checkbox';
    for (let i = 0; i < options.length; i++) {
        html += this.getOptionHTML(i, options[i], correct.includes(i), inputType, question.type === 'truefalse');
    }
    html += `</fieldset>`;
    if (question.type !== 'truefalse') {
        html += `<button type="button" class="btn btn-outline-secondary mt-3" onclick="event.preventDefault(); AdminQuizzes.addOption()">+ Добавить вариант</button>`;
    }
    return html;
  },

  getOptionHTML(index, text, isChecked, inputType, isReadonly) {
      return `
        <div class="form-check d-flex align-items-center gap-2 mb-2">
          <input type="${inputType}" class="form-check-input" name="correct" value="${index}" id="option_${index}" ${isChecked ? 'checked' : ''}>
          <input type="text" class="form-control option-input" value="${text}" placeholder="Текст ответа" ${isReadonly ? 'readonly' : ''}>
          ${!isReadonly ? `<button type="button" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); this.closest('.form-check').remove()">×</button>` : ''}
        </div>
      `;
  },

  addOption() {
    const container = document.getElementById('optionsContainer');
    const index = container.querySelectorAll('.option-item').length;
    const type = document.getElementById('questionType').value;
    const inputType = (type === 'single' || type === 'truefalse') ? 'radio' : 'checkbox';
    container.insertAdjacentHTML('beforeend', this.getOptionHTML(index, '', false, inputType, false));
  },
  
  collectOptionsData() {
    const data = {};
    const optionInputs = document.querySelectorAll('.option-input');
    data.options = Array.from(optionInputs).map(input => input.value.trim());
    const correctInputs = document.querySelectorAll(`input[name="correct"]:checked`);
    data.correct = Array.from(correctInputs).map(input => parseInt(input.value));
    return data;
  },

  // --- Methods for FILLBLANK ---
  renderFillBlankFields(question) {
    return `
      <p class="text-muted"><small>Используйте ___ (три знака подчеркивания) для обозначения пропуска в тексте вопроса выше.</small></p>
      <div class="mb-3">
        <label for="fillCorrect" class="form-label">
          Правильные ответы (через запятую) *
          <input type="text" class="form-control" id="fillCorrect" name="fillCorrect" value="${(question.correctAnswers || []).join(', ')}" required>
        </label>
      </div>
    `;
  },

  collectFillBlankData() {
    const data = {};
    data.correctAnswers = document.getElementById('fillCorrect').value.split(',').map(s => s.trim()).filter(Boolean);
    return data;
  },

  // --- Methods for SEQUENCE ---
  renderSequenceFields(question) {
    let html = `<fieldset id="stepsContainer"><legend>Шаги в правильном порядке</legend>`;
    (question.steps || ['','']).forEach(step => {
        html += this.getSequenceStepHTML(step);
    });
    html += `</fieldset>
      <button type="button" class="btn btn-outline-secondary mt-3" onclick="event.preventDefault(); AdminQuizzes.addSequenceStep()">+ Добавить шаг</button>`;
    return html;
  },

  getSequenceStepHTML(text) {
    return `
      <div class="d-flex gap-2 mb-2">
        <input type="text" class="form-control sequence-step-input" value="${text}" placeholder="Текст шага">
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); this.closest('.d-flex').remove()">×</button>
      </div>
    `;
  },

  addSequenceStep() {
    document.getElementById('stepsContainer').insertAdjacentHTML('beforeend', this.getSequenceStepHTML(''));
  },

  collectSequenceData() {
    const data = {};
    const stepInputs = document.querySelectorAll('.sequence-step-input');
    data.steps = Array.from(stepInputs).map(input => input.value.trim()).filter(Boolean);
    return data;
  },
  
  // --- Methods for DRAGDROP ---
  renderDragDropFields(question) {
      let html = `
        <fieldset class="mb-3">
            <legend class="h5">Элементы для перетаскивания (Draggables)</legend>
            <div id="drag-items-container">
      `;
      (question.items || ['','']).forEach(item => {
          html += `<div class="d-flex align-items-center gap-2 mb-2"><input type="text" class="form-control drag-item-input" value="${item}" placeholder="Текст элемента"><button type="button" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); this.closest('.d-flex').remove(); AdminQuizzes.updateDragDropMappings()">×</button></div>`;
      });
      html += `
            </div>
            <button type="button" class="btn btn-outline-secondary mt-3" onclick="event.preventDefault(); AdminQuizzes.addDragItem()">+ Добавить элемент</button>
        </fieldset>
        <fieldset class="mb-3">
            <legend class="h5">Цели (Dropzones)</legend>
            <div id="drop-targets-container">
      `;
      (question.targets || ['','']).forEach(target => {
        html += `<div class="d-flex align-items-center gap-2 mb-2"><input type="text" class="form-control drop-target-input" value="${target}" placeholder="Текст цели"><button type="button" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); this.closest('.d-flex').remove(); AdminQuizzes.updateDragDropMappings()">×</button></div>`;
      });
      html += `
            </div>
            <button type="button" class="btn btn-outline-secondary mt-3" onclick="event.preventDefault(); AdminQuizzes.addDropTarget()">+ Добавить цель</button>
        </fieldset>
        <fieldset class="mb-3">
            <legend class="h5">Правильные сопоставления</legend>
            <p class="text-muted"><small>Сопоставьте каждый элемент с его правильной целью.</small></p>
            <div id="mappings-container"></div>
        </fieldset>
      `;
      setTimeout(() => this.updateDragDropMappings(question.mappings), 0);
      return html;
  },
  addDragItem() {
    document.getElementById('drag-items-container').insertAdjacentHTML('beforeend', `<div class="d-flex align-items-center gap-2 mb-2"><input type="text" class="form-control drag-item-input" placeholder="Текст элемента"><button type="button" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); this.closest('.d-flex').remove(); AdminQuizzes.updateDragDropMappings()">×</button></div>`);
    this.updateDragDropMappings();
  },
  addDropTarget() {
    document.getElementById('drop-targets-container').insertAdjacentHTML('beforeend', `<div class="d-flex align-items-center gap-2 mb-2"><input type="text" class="form-control drop-target-input" placeholder="Текст цели"><button type="button" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); this.closest('.d-flex').remove(); AdminQuizzes.updateDragDropMappings()">×</button></div>`);
    this.updateDragDropMappings();
  },
  updateDragDropMappings(mappings = []) {
      const items = Array.from(document.querySelectorAll('.drag-item-input')).map(i => i.value).filter(Boolean);
      const targets = Array.from(document.querySelectorAll('.drop-target-input')).map(i => i.value).filter(Boolean);
      const mappingsContainer = document.getElementById('mappings-container');
      
      Array.from(document.querySelectorAll('.drag-item-input, .drop-target-input')).forEach(el => {
        el.oninput = () => this.updateDragDropMappings();
      });

      let html = '';
      items.forEach((item) => {
          const currentMapping = mappings.find(m => m.item === item);
          html += `
            <div class="row g-2 align-items-center mb-2">
                <div class="col-auto">
                    <label for="map_${item}" class="col-form-label">${item}</label>
                </div>
                <div class="col">
                    <select id="map_${item}" class="form-select" data-item-map="${item}">
                        <option value="">-- Выберите цель --</option>
                        ${targets.map(target => `<option value="${target}" ${currentMapping && currentMapping.target === target ? 'selected' : ''}>${target}</option>`).join('')}
                    </select>
                </div>
            </div>
          `;
      });
      mappingsContainer.innerHTML = html;
  },
  collectDragDropData() {
      const data = {};
      data.items = Array.from(document.querySelectorAll('.drag-item-input')).map(i => i.value.trim()).filter(Boolean);
      data.targets = Array.from(document.querySelectorAll('.drop-target-input')).map(i => i.value.trim()).filter(Boolean);
      data.mappings = [];
      document.querySelectorAll('#mappings-container select').forEach(select => {
          if (select.value) {
              data.mappings.push({ item: select.dataset.itemMap, target: select.value });
          }
      });
      return data;
  },

  // --- Methods for HOTSPOT ---
  renderHotspotFields(question) {
      let html = `
        <div class="mb-3">
          <label for="hotspotImage" class="form-label">
            URL изображения *
            <input type="text" class="form-control" id="hotspotImage" name="hotspotImage" value="${question.image || ''}" required oninput="document.getElementById('hotspot-preview').src = this.value">
          </label>
        </div>
        <fieldset class="mb-3">
            <legend class="h5">Зона ответа</legend>
            <p class="text-muted"><small>Кликните по превью, чтобы установить центр правильной зоны. Укажите радиус в пикселях.</small></p>
            <div class="row g-2">
                <div class="col-auto">
                    <label class="form-label">X: <input type="number" class="form-control" id="hotspotX" readonly value="${question.zone?.x || ''}"></label>
                </div>
                <div class="col-auto">
                    <label class="form-label">Y: <input type="number" class="form-control" id="hotspotY" readonly value="${question.zone?.y || ''}"></label>
                </div>
                <div class="col-auto">
                    <label class="form-label">Радиус: <input type="number" class="form-control" id="hotspotTolerance" value="${question.zone?.tolerance || 20}"></label>
                </div>
            </div>
            <div id="hotspot-preview-container" class="mt-3" style="position: relative; max-width: 400px; display: inline-block;">
                <img id="hotspot-preview" src="${question.image || ''}" class="img-fluid d-block" />
            </div>
        </fieldset>
      `;
      setTimeout(() => this.initHotspotPreview(), 0);
      return html;
  },
  initHotspotPreview() {
      const container = document.getElementById('hotspot-preview-container');
      const img = document.getElementById('hotspot-preview');
      const xInput = document.getElementById('hotspotX');
      const yInput = document.getElementById('hotspotY');
      const toleranceInput = document.getElementById('hotspotTolerance');
      if (!container || !img) return;

      const updateMarker = () => {
          let marker = container.querySelector('.hotspot-marker');
          if (!marker) {
              marker = document.createElement('div');
              marker.className = 'hotspot-marker admin-marker';
              container.appendChild(marker);
          }
          if (xInput.value && yInput.value && img.naturalWidth > 0) {
              const rect = img.getBoundingClientRect();
              const scale = rect.width / img.naturalWidth;
              marker.style.left = `${parseInt(xInput.value) * scale}px`;
              marker.style.top = `${parseInt(yInput.value) * scale}px`;
              const radius = parseInt(toleranceInput.value) || 0;
              marker.style.width = `${radius * 2 * scale}px`;
              marker.style.height = `${radius * 2 * scale}px`;
              marker.style.display = 'flex';
          } else {
              if (marker) marker.style.display = 'none';
          }
      };
      
      const setCoordinates = (e) => {
          if (img.naturalWidth === 0) return;
          const rect = e.target.getBoundingClientRect();
          const scale = e.target.naturalWidth / rect.width;
          const x = Math.round((e.clientX - rect.left) * scale);
          const y = Math.round((e.clientY - rect.top) * scale);
          xInput.value = x;
          yInput.value = y;
          updateMarker();
      }

      img.addEventListener('click', setCoordinates);
      img.addEventListener('load', updateMarker);
      toleranceInput.addEventListener('input', updateMarker);
      
      if(img.complete) updateMarker();
  },
  collectHotspotData() {
      const data = {};
      data.image = document.getElementById('hotspotImage').value.trim();
      data.zone = {
          x: parseInt(document.getElementById('hotspotX').value) || 0,
          y: parseInt(document.getElementById('hotspotY').value) || 0,
          tolerance: parseInt(document.getElementById('hotspotTolerance').value) || 20
      };
      return data;
  },

  // --- Generic Methods ---
  deleteQuiz(quizId) {
    if (confirm('Вы уверены, что хотите удалить тест?')) {
      Storage.deleteQuiz(quizId);
      Admin.setTab('quizzes');
    }
  },

  importQuizzes() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          Storage.importQuizzes(event.target.result);
          Admin.render();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
};

