/**
 * CORE.JS — Ядро платформы обучения
 * Отвечает за: инициализацию, роутинг, управление состоянием, переключение режимов
 */

const Core = {
  // Текущее состояние приложения
  state: {
    currentView: 'login',
    currentCourseId: null,
    currentLessonId: null,
    currentQuizId: null,
    isAdminMode: false,
    currentUser: null,
    isLoggedIn: false,
    isAdmin: false
  },

  // Константы для администратора
  ADMIN_CREDENTIALS: {
    login: 'admin',
    password: '123'
  },

  // Инициализация приложения
  init() {
    console.log('🚀 Платформа обучения — инициализация...');

    this.loadCurrentUser();
    Storage.loadCourses();
    Storage.loadQuizzes();

    // Первоначальная отрисовка на основе состояния
    this.render();
  },

  // Загрузка текущего пользователя из localStorage
  loadCurrentUser() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      this.state.currentUser = JSON.parse(saved);
      this.state.isLoggedIn = true;
      if (this.state.currentUser.id === 'admin') {
        this.state.isAdmin = true;
        this.state.isAdminMode = true; // Админ всегда начинает в режиме админки
      }
    } else {
        this.state.isLoggedIn = false;
    }
  },

  // Установка текущего представления
  setView(view, params = {}) {
    this.state.currentView = view;
    Object.assign(this.state, params);
    this.render();
  },

  // Основной рендеринг — переключает экраны
  render() {
    if (!this.state.isLoggedIn) {
      // Если пользователь не залогинен, показываем экран входа или регистрации
      if (this.state.currentView === 'register') {
        this.renderUserRegistration();
      } else {
        this.renderLoginScreen();
      }
      return;
    }
    
    if (this.state.isAdminMode) {
      this.renderAdminView();
    } else {
      this.renderStudentView();
    }
  },

  // Рендер для студента
  renderStudentView() {
    const header = document.getElementById('main-header');
    
    // Рендер шапки для студента
    header.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <div class="container-fluid">
          <a class="navbar-brand" href="#" onclick="event.preventDefault(); Core.setView('home');">Платформа обучения</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              ${this.state.currentUser ? `<li class="nav-item"><span class="navbar-text me-3">${this.state.currentUser.name}</span></li>` : ''}
              ${this.state.isAdmin ? `<li class="nav-item"><button class="btn btn-outline-secondary me-2" onclick="event.preventDefault(); Core.toggleAdminMode()">В админку</button></li>` : ''}
              <li class="nav-item"><button class="btn btn-secondary" onclick="event.preventDefault(); Core.switchUser()">Выйти</button></li>
            </ul>
          </div>
        </div>
      </nav>
    `;

    // Рендер контента для студента
    switch (this.state.currentView) {
      case 'home':
        this.renderHome();
        break;
      case 'course':
        this.renderCourse(this.state.currentCourseId);
        break;
      case 'lesson':
        this.renderLesson(this.state.currentCourseId, this.state.currentLessonId);
        break;
      case 'quiz':
        this.renderQuiz(this.state.currentQuizId);
        break;
      case 'register':
        this.renderUserRegistration();
        break;
      default:
        this.renderHome();
    }
  },

  // Рендер для админа
  renderAdminView() {
      Admin.render();
  },

  toggleAdminMode() {
      this.state.isAdminMode = !this.state.isAdminMode;
      this.render();
  },
  
  // Экран выбора роли
  renderLoginScreen() {
    this.state.currentView = 'login';
    const app = document.getElementById('app');
    const header = document.getElementById('main-header');
    header.innerHTML = '';

    app.innerHTML = `
      <div class="d-flex justify-content-center align-items-center vh-100">
        <div class="card text-center" style="width: 25rem;">
          <div class="card-body p-5">
            <h2 class="card-title mb-3">Добро пожаловать</h2>
            <p class="card-text text-muted mb-4">Выберите вашу роль для входа в систему.</p>
            <div class="d-grid gap-3">
              <button class="btn btn-primary btn-lg" onclick="Core.setView('register')"><i class="bi bi-person-fill me-2"></i>Я — обучаемый</button>
              <button class="btn btn-secondary btn-lg" onclick="Core.renderAdminLogin()"><i class="bi bi-shield-lock-fill me-2"></i>Я — администратор</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Экран входа для администратора
  renderAdminLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="d-flex justify-content-center align-items-center vh-100">
        <div class="card" style="width: 25rem;">
          <div class="card-body p-5">
            <div class="text-start mb-4">
                <a href="#" onclick="event.preventDefault(); Core.renderLoginScreen()" class="btn btn-sm btn-outline-secondary">← Назад</a>
            </div>
            <h2 class="card-title mb-4 text-center">Вход для администратора</h2>
            <form id="adminLoginForm">
              <div class="input-group mb-3">
                <span class="input-group-text"><i class="bi bi-person-circle"></i></span>
                <input type="text" class="form-control" id="adminLogin" name="adminLogin" required placeholder="Логин">
              </div>
              <div class="input-group mb-3">
                <span class="input-group-text"><i class="bi bi-key-fill"></i></span>
                <input type="password" class="form-control" id="adminPassword" name="adminPassword" required placeholder="Пароль">
              </div>
              <button type="submit" class="btn btn-primary w-100 mt-3">Войти</button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const login = document.getElementById('adminLogin').value;
      const password = document.getElementById('adminPassword').value;
      if (login === this.ADMIN_CREDENTIALS.login && password === this.ADMIN_CREDENTIALS.password) {
        this.state.isAdmin = true;
        this.state.isLoggedIn = true;
        this.state.isAdminMode = true;
        this.state.currentUser = { id: 'admin', name: 'Администратор', department: 'Админка' };
        localStorage.setItem('currentUser', JSON.stringify(this.state.currentUser));
        this.render();
      } else {
        alert('Неверный логин или пароль');
      }
    });
  },

  // Экран регистрации пользователя
  renderUserRegistration() {
    this.state.currentView = 'register';
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="d-flex justify-content-center align-items-center vh-100">
        <div class="card" style="width: 25rem;">
          <div class="card-body p-5">
             <div class="text-start mb-4">
                <a href="#" onclick="event.preventDefault(); Core.renderLoginScreen()" class="btn btn-sm btn-outline-secondary">← Назад</a>
            </div>
            <h2 class="card-title text-center mb-3">Регистрация</h2>
            <p class="card-text text-muted text-center mb-4">Пожалуйста, введите ваши данные для начала обучения.</p>
            <form id="userForm">
              <div class="input-group mb-3">
                <span class="input-group-text"><i class="bi bi-person-badge"></i></span>
                <input type="text" class="form-control" id="userName" name="userName" required placeholder="ФИО *">
              </div>
              <div class="input-group mb-3">
                <span class="input-group-text"><i class="bi bi-briefcase-fill"></i></span>
                <input type="text" class="form-control" id="userDepartment" name="userDepartment" placeholder="Отдел / Роль">
              </div>
              <button type="submit" class="btn btn-primary w-100 mt-3">Начать обучение</button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('userForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('userName').value.trim();
      const department = document.getElementById('userDepartment').value.trim();

      if (!name) return;

      const user = {
        id: `user-${Date.now()}`,
        name,
        department,
        registeredAt: Date.now()
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem(`user_${user.id}`, JSON.stringify(user));
      
      this.state.currentUser = user;
      this.state.isLoggedIn = true;
      this.state.isAdmin = false;
      this.state.isAdminMode = false;
      this.setView('home');
    });
  },

  // Главная страница — список курсов
  renderHome() {
    const app = document.getElementById('app');
    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="page-title">Доступные курсы</h1>
      </div>
    `;
  
    const courses = Storage.getCourses();
  
    if (courses.length === 0) {
      html += `<div class="alert alert-info" role="alert">Нет доступных курсов. Обратитесь к администратору.</div>`;
    } else {
      html += `<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">`;
      courses.forEach(course => {
        const progress = Users.getUserProgress(this.state.currentUser.id);
        const courseProgress = progress[course.id] || {};
        const completedLessons = Object.values(courseProgress).filter(l => l.completed).length;
        const totalLessons = course.lessons.length;
        const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
        html += `
          <div class="col">
            <div class="card h-100 shadow-sm">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title"><i class="bi bi-book-fill me-2"></i>${course.title}</h5>
                <p class="card-text text-muted flex-grow-1">${course.description || ''}</p>
                <div class="progress mt-3" style="height: 5px;">
                  <div class="progress-bar" role="progressbar" style="width: ${percent}%;" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <small class="text-muted mt-1">${completedLessons} из ${totalLessons} уроков</small>
              </div>
              <div class="card-footer bg-transparent border-0 p-3">
                <a href="#" class="btn btn-primary w-100" onclick="event.preventDefault(); Core.setView('course', { currentCourseId: '${course.id}' })">
                  <i class="bi ${percent === 100 ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-1"></i>${percent === 100 ? 'Повторить' : 'Продолжить'}
                </a>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }
  
    app.innerHTML = html;
  },
  
  // Страница курса — список уроков
  renderCourse(courseId) {
    const app = document.getElementById('app');
    const course = Storage.getCourses().find(c => c.id === courseId);
    if (!course) {
      this.setView('home');
      return;
    }
  
    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>${course.title}</h2>
          <p class="lead text-muted">Список уроков</p>
        </div>
        <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); Core.setView('home')">← Назад к курсам</a>
      </div>
    `;
  
    html += '<ul class="list-group">';
    course.lessons.forEach((lesson, index) => {
      const progress = Users.getUserProgress(this.state.currentUser.id);
      const lessonProgress = progress[course.id]?.[lesson.id] || {};
      const isCompleted = lessonProgress.completed || false;
      const isLocked = this.isLessonLocked(course, index, progress);
  
      html += `
        <li class="list-group-item d-flex justify-content-between align-items-center ${isLocked ? 'list-group-item-light text-muted' : ''}" ${isLocked ? 'aria-disabled="true"' : ''}>
          <div>
            <h5 class="mb-1"><i class="bi ${isCompleted ? 'bi-check-circle-fill text-success' : 'bi-circle'} me-2"></i>${index + 1}. ${lesson.title}</h5>
            <small>${isCompleted ? '✅ Пройдено' : 'Не пройдено'}</small>
          </div>
          <a 
            href="#"
            class="btn btn-sm ${isCompleted ? 'btn-outline-secondary' : 'btn-primary'} ${isLocked ? 'disabled' : ''}"
            onclick="event.preventDefault(); if(!this.closest('li').hasAttribute('aria-disabled')) Core.setView('lesson', { currentCourseId: '${course.id}', currentLessonId: '${lesson.id}' })" 
            title="${isLocked ? 'Сначала пройдите предыдущий урок' : ''}"
          >
            <i class="bi ${isCompleted ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-1"></i>${isCompleted ? 'Повторить' : 'Начать'}
          </a>
        </li>
      `;
    });
    html += '</ul>';
  
    app.innerHTML = html;
  },
  
  // Проверка, заблокирован ли урок
  isLessonLocked(course, lessonIndex, progress) {
    if (lessonIndex === 0) return false;
    if (!course.lockUntilPassed) return false;
  
    const prevLesson = course.lessons[lessonIndex - 1];
    const prevProgress = progress[course.id]?.[prevLesson.id] || {};
    return !prevProgress.completed;
  },
  
  // Страница урока — контент + тесты
  renderLesson(courseId, lessonId) {
    const app = document.getElementById('app');
    const course = Storage.getCourse(courseId);
    const lesson = course.lessons.find(l => l.id === lessonId);
    if (!lesson) {
      this.setView('course', { currentCourseId: courseId });
      return;
    }
  
    this.state.currentCourseId = courseId;
    this.state.currentLessonId = lessonId;
  
    let html = `
       <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>${lesson.title}</h2>
          <p class="text-muted">Курс: ${course.title}</p>
        </div>
        <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); Core.setView('course', { currentCourseId: '${courseId}' })">← Назад к урокам</a>
      </div>
      <div class="card">
        <div class="card-body" id="lessonContent">
            <div class="d-flex align-items-center">
              <strong>Загрузка контента...</strong>
              <div class="spinner-border ms-auto" role="status" aria-hidden="true"></div>
            </div>
        </div>
      </div>
    `;
  
    app.innerHTML = html;
  
    setTimeout(() => {
      const contentDiv = document.getElementById('lessonContent');
      let processedContent = Shortcodes.parse(lesson.content || '');
      
      contentDiv.innerHTML = processedContent;
    }, 100);
  },
  
  // Завершение урока
  completeLesson(courseId, lessonId) {
    Storage.saveUserProgress(this.state.currentUser.id, courseId, lessonId, {
      completed: true,
      score: 100,
      attempts: 1,
      passedAt: Date.now()
    });
    this.setView('course', { currentCourseId: courseId });
  },
  
  // Рендеринг теста
  renderQuiz(quizId) {
    const quiz = Storage.getQuiz(quizId);
    if (!quiz) {
      alert('Тест не найден');
      return;
    }
  
    const attempts = Storage.getQuizAttempts(this.state.currentUser.id, quizId);
    if (quiz.maxAttempts > 0 && attempts >= quiz.maxAttempts) {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="card text-center shadow-sm">
          <div class="card-body p-5">
            <h2 class="card-title">Тест недоступен</h2>
            <p class="card-text text-muted">Вы исчерпали все ${quiz.maxAttempts} попыток.</p>
            <a href="#" class="btn btn-secondary mt-3" onclick="event.preventDefault(); Core.renderLesson(Core.state.currentCourseId, Core.state.currentLessonId);">Вернуться к уроку</a>
          </div>
        </div>
      `;
      return;
    }
  
    Quizzes.render(quiz, (result) => {
      Storage.saveQuizResult(this.state.currentUser.id, quizId, result);
      this.showQuizResult(quiz, result, this.state.currentCourseId, this.state.currentLessonId);
    });
  },

  // Сбросить попытки прохождения теста
  resetQuizAttempts(userId, quizId) {
    Storage.resetQuizAttempts(userId, quizId);
    this.renderQuiz(quizId);
  },

  // Показать результат теста
  showQuizResult(quiz, result, courseId, lessonId) {
    const app = document.getElementById('app');
    const isPassed = result.score >= quiz.passingScore;

    if (isPassed) {
      const course = Storage.getCourse(courseId);
      const lesson = course.lessons.find(l => l.id === lessonId);

      if (lesson) {
        const quizIdsInLesson = [];
        const regex = /\[quiz:([^\]]+)\]/g;
        let match;
        while ((match = regex.exec(lesson.content)) !== null) {
          quizIdsInLesson.push(match[1]);
        }

        const allQuizzesPassed = quizIdsInLesson.every(qId => {
          const q = Storage.getQuiz(qId);
          const lastResult = Storage.getLastQuizResult(this.state.currentUser.id, qId);
          return lastResult && lastResult.score >= q.passingScore;
        });

        if (allQuizzesPassed) {
          Core.completeLesson(courseId, lessonId);
          return; 
        }
      }
    }

    let html = `
      <div class="card text-center shadow-sm">
        <div class="card-body p-5">
          <h2 class="card-title">Результат теста</h2>
          <h3 class="card-subtitle mb-3 fw-bold ${isPassed ? 'text-success' : 'text-danger'}">
            Ваш результат: ${result.score}%
          </h3>
          <p class="card-text fs-5">Вы ${isPassed ? '<strong>прошли</strong>' : '<strong>не прошли</strong>'} тест. Проходной балл: ${quiz.passingScore}%</p>
          <div class="d-grid gap-2 d-md-flex justify-content-md-center mt-4">
    `;
  
    const attempts = Storage.getQuizAttempts(this.state.currentUser.id, quiz.id);
    if (!isPassed && (quiz.maxAttempts === 0 || attempts < quiz.maxAttempts)) {
      html += `
        <button class="btn btn-primary" onclick="event.preventDefault(); Core.setView('quiz', { currentQuizId: '${quiz.id}'})">
          Пройти повторно
        </button>
      `;
    }
    
    html += `
          <button class="btn btn-secondary" onclick="event.preventDefault(); Core.setView('course', { currentCourseId: '${courseId}'})">К урокам</button>
        </div>
      </div>
    </div>
    `;
  
    app.innerHTML = html;
  },
  
  // Смена пользователя
  switchUser() {
    localStorage.removeItem('currentUser');
    this.state.currentUser = null;
    this.state.isLoggedIn = false;
    this.state.isAdmin = false;
    this.state.isAdminMode = false;
    
    const header = document.getElementById('main-header');
    header.innerHTML = '';

    this.renderLoginScreen();
  },
};