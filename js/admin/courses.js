/**
 * ADMIN/COURSES.JS — Модуль управления курсами и уроками
 * Отвечает за: рендеринг вкладок, создание, редактирование и удаление курсов/уроков
 */
const AdminCourses = {
  // Текущее состояние
  state: {
    editingCourse: null,
    editingLesson: null,
  },
  
  // Вкладка "Курсы"
  renderTab() {
    const courses = Storage.getCourses();
    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2>Управление курсами</h2>
              <p class="text-muted">Создавайте, редактируйте и управляйте учебными материалами.</p>
          </div>
          <a href="#" class="btn btn-primary" onclick="event.preventDefault(); AdminCourses.createCourse()">+ Создать курс</a>
      </div>
    `;

    if (courses.length === 0) {
      html += `<div class="alert alert-info">Нет курсов. Создайте первый курс.</div>`;
    } else {
      courses.forEach(course => {
        html += `
          <div class="card mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="card-title">${course.title}</h5>
                  <p class="card-text text-muted">${course.description || ''}</p>
                  <small class="text-muted">Уроков: ${course.lessons.length}</small>
                </div>
                <div class="d-flex gap-2">
                  <a href="#" class="btn btn-outline-secondary btn-sm" onclick="event.preventDefault(); AdminCourses.editCourse('${course.id}')">Редактировать</a>
                  <a href="#" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); AdminCourses.deleteCourse('${course.id}')">Удалить</a>
                </div>
              </div>
              <hr class="my-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="courseLock-${course.id}" ${course.lockUntilPassed ? 'checked' : ''} onchange="AdminCourses.toggleLock('${course.id}')">
                <label class="form-check-label" for="courseLock-${course.id}">Блокировать следующий урок до прохождения</label>
              </div>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <h6 class="mb-0">Уроки</h6>
                <a href="#" class="btn btn-outline-secondary btn-sm" onclick="event.preventDefault(); AdminCourses.createLesson('${course.id}')">+ Добавить урок</a>
              </div>
      `;

        if (course.lessons.length === 0) {
          html += `<div class="alert alert-info mt-3">Нет уроков. Добавьте первый урок.</div>`;
        } else {
          html += `<ul class="list-group mt-3">`;
          course.lessons.forEach(lesson => {
            html += `
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <strong>${lesson.title}</strong>
                <div class="d-flex gap-2">
                  <a href="#" class="btn btn-outline-secondary btn-sm" onclick="event.preventDefault(); AdminCourses.editLesson('${course.id}', '${lesson.id}')">Редактировать</a>
                  <a href="#" class="btn btn-outline-danger btn-sm" onclick="event.preventDefault(); AdminCourses.deleteLesson('${course.id}', '${lesson.id}')">×</a>
                </div>
              </li>
            `;
          });
          html += `</ul>`;
        }

        html += `</article>`;
      });
    }

    html += `
      <div class="card mt-4">
        <div class="card-body">
          <h5 class="card-title">Экспорт/Импорт</h5>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" onclick="Storage.exportCourses()">Экспорт курсов (JSON)</button>
            <button class="btn btn-secondary" onclick="AdminCourses.importCourses()">Импорт курсов (JSON)</button>
          </div>
        </div>
      </div>
    `;

    return html;
  },

  // Создание курса
  createCourse() {
    this.state.editingCourse = {
      id: Storage.generateId('course'),
      title: '',
      description: '',
      lockUntilPassed: true,
      lessons: []
    };
    this.editCourse(this.state.editingCourse.id);
  },

  // Редактирование курса
  editCourse(courseId) {
    const course = Storage.getCourses().find(c => c.id === courseId) || this.state.editingCourse;
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2>${course.title ? 'Редактирование курса' : 'Создание курса'}</h2>
          </div>
          <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); Admin.setTab('courses')">← Назад</a>
      </div>
      <div class="card">
        <div class="card-body">
          <form id="courseForm">
            <div class="mb-3">
              <label for="courseTitle" class="form-label">Название курса *</label>
              <input type="text" class="form-control" id="courseTitle" value="${course.title}" required>
            </div>
            <div class="mb-3">
              <label for="courseDescription" class="form-label">Описание</label>
              <textarea class="form-control" id="courseDescription" rows="3">${course.description || ''}</textarea>
            </div>
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" id="courseLock" ${course.lockUntilPassed ? 'checked' : ''}>
              <label class="form-check-label" for="courseLock">Блокировать следующий урок до прохождения</label>
            </div>
            <div class="d-flex gap-2 justify-content-end mt-4">
              <button type="submit" class="btn btn-primary">Сохранить</button>
              <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); Admin.setTab('courses')">Отмена</a>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('courseForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('courseTitle').value.trim();
      const description = document.getElementById('courseDescription').value.trim();
      const lockUntilPassed = document.getElementById('courseLock').checked;

      if (!title) return;

      const updatedCourse = { ...course, title, description, lockUntilPassed };
      Storage.saveCourse(updatedCourse);
      Admin.setTab('courses');
    });
  },

  // Удаление курса
  deleteCourse(courseId) {
    if (confirm('Вы уверены, что хотите удалить курс и все его уроки?')) {
      Storage.deleteCourse(courseId);
      Admin.setTab('courses');
    }
  },

  // Переключение блокировки курса
  toggleLock(courseId) {
    const course = Storage.getCourses().find(c => c.id === courseId);
    if (course) {
      course.lockUntilPassed = !course.lockUntilPassed;
      Storage.saveCourse(course);
    }
  },

  // Создание урока
  createLesson(courseId) {
    this.state.editingLesson = {
      id: Storage.generateId('lesson'),
      title: '',
      content: ''
    };
    this.editLesson(courseId, this.state.editingLesson.id);
  },

  // Редактирование урока
  editLesson(courseId, lessonId) {
    const course = Storage.getCourses().find(c => c.id === courseId);
    const lesson = course.lessons.find(l => l.id === lessonId) || this.state.editingLesson;
    const quizzes = Storage.getQuizzes();
    const app = document.getElementById('app');

    let quizOptions = quizzes.map(q => `<option value="${q.id}">${q.title}</option>`).join('');

    app.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>${lesson.title ? 'Редактирование' : 'Создание'} урока</h2>
        </div>
        <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); Admin.setTab('courses')">← Назад к курсам</a>
      </div>
      <div class="card">
        <div class="card-body">
          <form id="lessonForm">
            <div class="mb-3">
              <label for="lessonTitle" class="form-label">Название урока *</label>
              <input type="text" class="form-control" id="lessonTitle" value="${lesson.title}" required>
            </div>
            <div class="mb-3">
              <label for="lessonContent" class="form-label">Контент урока (Markdown + шорткоды)</label>
              <textarea class="form-control monospace-font" id="lessonContent" rows="10">${lesson.content || ''}</textarea>
              <small class="form-text text-muted">
                Шорткоды: <code>[img:path/to/image.jpg]</code>, <code>[file:path/to/doc.pdf]</code>, <code>[video:path/to/video.mp4]</code>, <code>[quiz:quiz-id]</code>
              </small>
            </div>

            <hr>

            <fieldset class="mb-3">
                <legend class="h5">Прикрепленные тесты</legend>
                <div id="attached-quizzes-list" class="list-group mb-3"></div>
                <div class="input-group">
                    <select id="quiz-to-attach" class="form-select">
                        <option value="">-- Выберите тест --</option>
                        ${quizOptions}
                    </select>
                    <button type="button" class="btn btn-secondary" onclick="AdminCourses.attachQuiz()">Прикрепить тест</button>
                </div>
            </fieldset>

            <div class="d-flex gap-2 justify-content-end mt-4">
              <button type="submit" class="btn btn-primary">Сохранить урок</button>
              <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); Admin.setTab('courses')">Отмена</a>
            </div>
          </form>
        </div>
      </div>
    `;

    this.renderAttachedQuizzes();

    document.getElementById('lessonForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('lessonTitle').value.trim();
      const content = document.getElementById('lessonContent').value;

      if (!title) return;

      const updatedLesson = { ...lesson, title, content };
      
      // --- FIX STARTS HERE ---
      const courses = Storage.getCourses(); // Get the courses array
      const courseIndex = courses.findIndex(c => c.id === courseId);
      // --- FIX ENDS HERE ---
      
      if (courseIndex >= 0) {
        const lessonIndex = courses[courseIndex].lessons.findIndex(l => l.id === lessonId);
        if (lessonIndex >= 0) {
          // --- FIX STARTS HERE ---
          courses[courseIndex].lessons[lessonIndex] = updatedLesson;
          // --- FIX ENDS HERE ---
        } else {
          // --- FIX STARTS HERE ---
          courses[courseIndex].lessons.push(updatedLesson);
          // --- FIX ENDS HERE ---
        }
        Storage.saveCourses();
      }

      Admin.setTab('courses');
    });
  },

  renderAttachedQuizzes() {
      const content = document.getElementById('lessonContent').value;
      const attachedList = document.getElementById('attached-quizzes-list');
      const quizIds = (content.match(/\[quiz:([^\]]+)\]/g) || []).map(q => q.slice(6, -1));

      if (quizIds.length === 0) {
          attachedList.innerHTML = '<p class="text-muted"><small>К этому уроку еще не прикреплен ни один тест.</small></p>';
          return;
      }

      let html = '';
      quizIds.forEach(quizId => {
          const quiz = Storage.getQuiz(quizId);
          if(quiz) {
              html += `
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                      <span>${quiz.title}</span>
                      <a href="#" onclick="event.preventDefault(); AdminCourses.detachQuiz('${quizId}')" class="btn btn-danger btn-sm">Удалить</a>
                  </div>
              `;
          }
      });
      attachedList.innerHTML = html;
  },

  attachQuiz() {
      const select = document.getElementById('quiz-to-attach');
      const quizId = select.value;
      if (!quizId) return;

      const textarea = document.getElementById('lessonContent');
      const shortcode = `\n[quiz:${quizId}]`;

      if (textarea.value.includes(shortcode.trim())) {
          alert('Этот тест уже прикреплен.');
          return;
      }

      textarea.value += shortcode;
      select.value = ''; // Reset dropdown
      this.renderAttachedQuizzes();
  },

  detachQuiz(quizId) {
      const textarea = document.getElementById('lessonContent');
      const shortcodeRegex = new RegExp(`\\n?\\[quiz:${quizId}\\]`, 'g');
      textarea.value = textarea.value.replace(shortcodeRegex, '');
      this.renderAttachedQuizzes();
  },

  // Удаление урока
  deleteLesson(courseId, lessonId) {
    if (confirm('Вы уверены, что хотите удалить урок?')) {
      const course = Storage.getCourse(courseId);
      if (course) {
        course.lessons = course.lessons.filter(l => l.id !== lessonId);
        Storage.saveCourse(course);
        Admin.setTab('courses');
      }
    }
  },

  // Импорт курсов
  importCourses() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (Storage.importCourses(event.target.result)) {
            Admin.setTab('courses');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
};

