/**
 * USERS.JS — Управление пользователями и отчётами
 * Отвечает за: регистрацию, смену пользователя, генерацию и экспорт отчётов
 */
const Users = {
  // Показать экран регистрации
  showRegistration() {
    Core.setView('register');
  },

  // Смена пользователя
  switchUser() {
    localStorage.removeItem('currentUser');
    Core.state.currentUser = null;
    this.showRegistration();
  },

  // Получение всех пользователей (кто когда-либо запускал платформу на этом устройстве)
  getAllUsers() {
    const users = [];
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('user_')) {
        try {
          const user = JSON.parse(localStorage.getItem(key));
          if (user && user.id && user.name) { // Ensure it's a valid user object
            users.push(user);
          } else {
            console.warn(`Malformed user data found for key: ${key}`);
          }
        } catch (e) {
          console.error(`Error parsing user data for key ${key}:`, e);
        }
      }
    }
    
    // Ensure the currently logged-in user is in the list if they are not already
    // This handles the case where a user might have logged in via the old registration method
    // and their user_ entry might not exist yet, but currentUser is set. If currentUser is an admin, it should not be added to the list of learners.
    if (Core.state.currentUser && Core.state.currentUser.id !== 'admin' && !users.some(u => u.id === Core.state.currentUser.id)) {
        // Create a full user object from currentUser state if it's not already in the list
        // This ensures consistency in the user object structure
        const currentUserFromState = {
            id: Core.state.currentUser.id,
            name: Core.state.currentUser.name || `Пользователь ${Core.state.currentUser.id}`,
            department: Core.state.currentUser.department || 'Неизвестно',
            registeredAt: Core.state.currentUser.registeredAt || 0
        };
        users.push(currentUserFromState);
    }
    
    return users;
  },

  // Получение прогресса пользователя по всем курсам
  getUserProgress(userId) {
    const key = `progress_${userId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : {};
  },

  // Форматирование даты
  formatDate(timestamp) {
    if (!timestamp) return 'Неизвестно';
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Подсчёт общего прогресса пользователя
  calculateUserStats(userId) {
    const progress = this.getUserProgress(userId);
    let totalLessons = 0;
    let completedLessons = 0;
    let totalScore = 0;
    let coursesCompleted = 0;

    const courses = Storage.getCourses();
    courses.forEach(course => {
      const courseProgress = progress[course.id] || {};
      const lessons = course.lessons || [];
      totalLessons += lessons.length;

      let courseCompleted = true;
      lessons.forEach(lesson => {
        const lessonProgress = courseProgress[lesson.id] || {};
        if (lessonProgress.completed) {
          completedLessons++;
          totalScore += lessonProgress.score || 0;
        } else {
          courseCompleted = false;
        }
      });

      if (courseCompleted && lessons.length > 0) {
        coursesCompleted++;
      }
    });

    const avgScore = totalLessons > 0 ? Math.round(totalScore / completedLessons) : 0;
    const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      totalLessons,
      completedLessons,
      coursesCompleted,
      avgScore,
      completionRate
    };
  }
};

// Отдельный объект для отчётов (Reports)
const AdminReports = {
  // Рендеринг вкладки отчётов и управления пользователями
  renderTab() {
    const users = Users.getAllUsers();

    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Управление пользователями и отчёты</h2>
        <div class="d-flex gap-2">
          <button id="addUserBtn" class="btn btn-success"><i class="bi bi-person-plus me-2"></i>Добавить пользователя</button>
          <button id="exportUsersJSONBtn" class="btn btn-primary"><i class="bi bi-file-earmark-code me-2"></i>Экспорт JSON</button>
          <button id="exportUsersCSVBtn" class="btn btn-primary"><i class="bi bi-file-earmark-spreadsheet me-2"></i>Экспорт CSV</button>
        </div>
      </div>
      <div class="mb-4">
        <input type="text" id="userSearch" placeholder="Поиск по ФИО или отделу..." class="form-control w-auto">
      </div>
      <div class="card">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Отдел</th>
              <th>Пройдено уроков</th>
              <th>Средний балл</th>
              <th>Курсов завершено</th>
              <th>Последняя активность</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            ${this._renderUserTable(users)}
          </tbody>
        </table>
      </div>

      <!-- Модальное окно для добавления/редактирования пользователя -->
      <div class="modal fade" id="userModal" tabindex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="userModalLabel">Добавить/Редактировать пользователя</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="userFormModal">
                <input type="hidden" id="userIdModal">
                <div class="mb-3">
                  <label for="userNameModal" class="form-label">ФИО</label>
                  <input type="text" class="form-control" id="userNameModal" required>
                </div>
                <div class="mb-3">
                  <label for="userDepartmentModal" class="form-label">Отдел</label>
                  <input type="text" class="form-control" id="userDepartmentModal">
                </div>
                <button type="submit" class="btn btn-primary">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    return html;
  },

  _renderUserTable(users) {
    if (users.length === 0) {
      return `<tr><td colspan="7" class="text-center p-3">Нет данных</td></tr>`;
    }
    let rows = '';
    users.forEach(user => {
      const stats = Users.calculateUserStats(user.id);
      const lastActivity = Users.getUserProgress(user.id);
      let lastDate = 'Никогда';
      for (const courseId in lastActivity) {
        for (const lessonId in lastActivity[courseId]) {
          const lesson = lastActivity[courseId][lessonId];
          if (lesson.updatedAt && (!lastDate || lesson.updatedAt > new Date(lastDate).getTime())) {
            lastDate = Users.formatDate(lesson.updatedAt);
          }
        }
      }

      rows += `
        <tr>
          <td>${user.name}</td>
          <td>${user.department || 'Не указан'}</td>
          <td>${stats.completedLessons} из ${stats.totalLessons}</td>
          <td>${stats.avgScore}%</td>
          <td>${stats.coursesCompleted}</td>
          <td>${lastDate}</td>
          <td>
            <button class="btn btn-sm btn-info edit-user-btn" data-user-id="${user.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    });
    return rows;
  },

  initEventListeners() {
    const app = document.getElementById('app');

    // Поиск пользователей
    document.getElementById('userSearch').addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#usersTableBody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });

    // Открытие модального окна добавления пользователя
    document.getElementById('addUserBtn').addEventListener('click', () => {
      this._openUserModal();
    });

    // Открытие модального окна редактирования пользователя
    app.querySelectorAll('.edit-user-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.userId;
        const user = Users.getAllUsers().find(u => u.id === userId);
        if (user) {
          this._openUserModal(user);
        }
      });
    });

    // Удаление пользователя
    app.querySelectorAll('.delete-user-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.userId;
        if (confirm('Вы уверены, что хотите удалить этого пользователя и все его данные?')) {
          this._deleteUser(userId);
        }
      });
    });

    // Сохранение пользователя из модального окна
    document.getElementById('userFormModal').addEventListener('submit', (e) => {
      e.preventDefault();
      this._saveUser();
    });

    // Экспорт JSON
    document.getElementById('exportUsersJSONBtn').addEventListener('click', () => {
      this.exportJSON();
    });

    // Экспорт CSV
    document.getElementById('exportUsersCSVBtn').addEventListener('click', () => {
      this.exportCSV();
    });
  },

  _openUserModal(user = null) {
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    const userIdModal = document.getElementById('userIdModal');
    const userNameModal = document.getElementById('userNameModal');
    const userDepartmentModal = document.getElementById('userDepartmentModal');
    const userModalLabel = document.getElementById('userModalLabel');

    if (user) {
      userIdModal.value = user.id;
      userNameModal.value = user.name;
      userDepartmentModal.value = user.department || '';
      userModalLabel.textContent = 'Редактировать пользователя';
    } else {
      userIdModal.value = '';
      userNameModal.value = '';
      userDepartmentModal.value = '';
      userModalLabel.textContent = 'Добавить пользователя';
    }
    userModal.show();
  },

  _saveUser() {
    const userId = document.getElementById('userIdModal').value;
    const userName = document.getElementById('userNameModal').value.trim();
    const userDepartment = document.getElementById('userDepartmentModal').value.trim();

    if (!userName) {
      alert('ФИО пользователя не может быть пустым.');
      return;
    }

    const user = {
      id: userId || Storage.generateId('user'),
      name: userName,
      department: userDepartment,
      registeredAt: userId ? Users.getAllUsers().find(u => u.id === userId).registeredAt : Date.now()
    };

    Storage.saveUser(user);
    const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
    userModal.hide();
    Core.renderAdminView(); // Перерендерить админку для обновления списка
  },

  _deleteUser(userId) {
    Storage.deleteUser(userId);
    Core.renderAdminView(); // Перерендерить админку для обновления списка
  },

  // Экспорт отчётов в JSON (обновлено для пользователей)
  exportJSON() {
    const users = Users.getAllUsers();
    const reports = {};

    users.forEach(user => {
      reports[user.id] = {
        name: user.name,
        department: user.department,
        registeredAt: Users.formatDate(user.registeredAt),
        stats: Users.calculateUserStats(user.id),
        progress: Users.getUserProgress(user.id)
      };
    });

    Storage.downloadFile(
      `users_reports_${new Date().toISOString().slice(0,10)}.json`,
      JSON.stringify(reports, null, 2),
      'application/json'
    );
  },

  // Экспорт отчётов в CSV (обновлено для пользователей)
  exportCSV() {
    let csv = 'ID,ФИО,Отдел,Зарегистрирован,Пройдено уроков,Всего уроков,Средний балл,Курсов завершено,Последняя активность\n';

    const users = Users.getAllUsers();
    users.forEach(user => {
      const stats = Users.calculateUserStats(user.id);
      const lastActivity = Users.getUserProgress(user.id);
      let lastDate = 'Никогда';
      for (const courseId in lastActivity) {
        for (const lessonId in lastActivity[courseId]) {
          const lesson = lastActivity[courseId][lessonId];
          if (lesson.updatedAt && (!lastDate || lesson.updatedAt > new Date(lastDate).getTime())) {
            lastDate = Users.formatDate(lesson.updatedAt);
          }
        }
      }

      csv += `"${user.id}","${user.name}","${user.department || ''}","${Users.formatDate(user.registeredAt)}","${stats.completedLessons}","${stats.totalLessons}","${stats.avgScore}","${stats.coursesCompleted}","${lastDate}"\n`;
    });

    Storage.downloadFile(
      `users_reports_${new Date().toISOString().slice(0,10)}.csv`,
      csv,
      'text/csv'
    );
  }
};
