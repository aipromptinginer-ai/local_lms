/**
 * ADMIN.JS — Главный модуль админки
 * Служит точкой входа и перенаправляет запросы к подмодулям
 */
const Admin = {
  state: {
    currentTab: 'dashboard',
  },
  app: null,

  renderHeader() {
    return `
      <nav class="navbar navbar-expand-lg">
        <div class="container-fluid align-items-center">
          <a class="navbar-brand" href="#"><i class="bi bi-sliders me-2"></i>Администрирование</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto align-items-center">
              <li class="nav-item">
                <span class="navbar-text me-3"><i class="bi bi-person-circle me-2"></i>Администратор</span>
              </li>
              <li class="nav-item">
                <button class="btn btn-light" onclick="event.preventDefault(); Core.switchUser()"><i class="bi bi-box-arrow-right me-2"></i>Выйти</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    `;
  },

  render() {
    if (!Core.state.isAdmin) {
      alert('Доступ запрещен.');
      Core.setView('home');
      return;
    }
    this.app = document.getElementById('app');
    const header = document.getElementById('main-header');
    
    // Рендерим шапку админки с помощью Bootstrap Navbar
    header.innerHTML = this.renderHeader();
    header.classList.add('admin-header');

    // Рендерим основную часть админки
    let html = `
      <ul class="nav nav-pills mb-3 mt-4">
        <li class="nav-item">
          <a class="nav-link ${this.state.currentTab === 'dashboard' ? 'active' : ''}" href="#" onclick="event.preventDefault(); Admin.setTab('dashboard')"><i class="bi bi-grid-1x2-fill me-2"></i>Дашборд</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${this.state.currentTab === 'courses' ? 'active' : ''}" href="#" onclick="event.preventDefault(); Admin.setTab('courses')"><i class="bi bi-journal-bookmark-fill me-2"></i>Курсы</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${this.state.currentTab === 'quizzes' ? 'active' : ''}" href="#" onclick="event.preventDefault(); Admin.setTab('quizzes')"><i class="bi bi-patch-check-fill me-2"></i>Тесты</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${this.state.currentTab === 'reports' ? 'active' : ''}" href="#" onclick="event.preventDefault(); Admin.setTab('reports')"><i class="bi bi-file-earmark-bar-graph-fill me-2"></i>Отчёты</a>
        </li>
      </ul>
      <div id="admin-content" class="card">
         <div class="card-body">
      `;

    switch (this.state.currentTab) {
      case 'dashboard':
        html += AdminDashboard.renderTab();
        break;
      case 'courses':
        html += AdminCourses.renderTab();
        break;
      case 'quizzes':
        html += AdminQuizzes.renderTab();
        break;
      case 'reports':
        html += AdminReports.renderTab();
        break;
      default:
        html += `<div class="alert alert-info">Выберите вкладку.</div>`;
    }

    html += `</div></div>`;
    this.app.innerHTML = html;

    // Инициализация обработчиков событий для активной вкладки
    if (this.state.currentTab === 'courses') {
      AdminCourses.initEventListeners();
    }
    if (this.state.currentTab === 'quizzes') {
      AdminQuizzes.initEventListeners();
    }
  },

  setTab(tab) {
    if (!Core.state.isAdmin) return;
    this.state.currentTab = tab;
    this.render();
  },
};