/**
 * ADMIN.JS — Главный модуль админки
 * Служит точкой входа и перенаправляет запросы к подмодулям
 */
const Admin = {
  state: {
    currentTab: 'dashboard',
  },
  app: null,

  render() {
    if (!Core.state.isAdmin) {
      alert('Доступ запрещен.');
      Core.setView('home');
      return;
    }
    this.app = document.getElementById('app');
    const header = document.getElementById('main-header');
    
    // Рендерим шапку админки с помощью Bootstrap Navbar
    header.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">Администрирование</a>
          <div class="d-flex">
            <span class="navbar-text me-3">${Core.state.currentUser.name}</span>
            <button class="btn btn-outline-light" onclick="event.preventDefault(); Core.toggleAdminMode()">К платформе</button>
            <button class="btn btn-secondary ms-2" onclick="event.preventDefault(); Core.switchUser()">Выйти</button>
          </div>
        </div>
      </nav>
    `;

    // Рендерим основную часть админки
    let html = `
      <ul class="nav nav-pills mb-3">
        <li class="nav-item">
          <a class="nav-link ${this.state.currentTab === 'dashboard' ? 'active' : ''}" href="#" onclick="event.preventDefault(); Admin.setTab('dashboard')">Дашборд</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${this.state.currentTab === 'courses' ? 'active' : ''}" href="#" onclick="event.preventDefault(); Admin.setTab('courses')">Курсы</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${this.state.currentTab === 'quizzes' ? 'active' : ''}" href="#" onclick="event.preventDefault(); Admin.setTab('quizzes')">Тесты</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${this.state.currentTab === 'reports' ? 'active' : ''}" href="#" onclick="event.preventDefault(); Admin.setTab('reports')">Отчёты</a>
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