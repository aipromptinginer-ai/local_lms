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
    const userKeys = Object.keys(localStorage).filter(key => key.startsWith('progress_'));
    
    userKeys.forEach(key => {
      const userId = key.replace('progress_', '');
      let user = JSON.parse(localStorage.getItem(`user_${userId}`)) || {
        id: userId,
        name: `Пользователь ${userId}`,
        department: 'Неизвестно',
        registeredAt: 0
      };
      
      users.push(user);
    });
    
    if (Core.state.currentUser && !users.find(u => u.id === Core.state.currentUser.id)) {
        users.push(Core.state.currentUser);
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
const Reports = {
  // Рендеринг страницы отчётов
  render() {
    const app = document.getElementById('app');
    const users = Users.getAllUsers();

    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <button onclick="Core.setView('admin')" class="btn btn-secondary">← Назад</button>
        <h2>Отчёты по пользователям</h2>
        <div class="d-flex gap-2">
          <button onclick="Reports.exportJSON()" class="btn btn-primary">Экспорт JSON</button>
          <button onclick="Reports.exportCSV()" class="btn btn-primary">Экспорт CSV</button>
        </div>
      </div>
      <div class="p-4">
        <div class="mb-4">
          <input type="text" id="reportSearch" placeholder="Поиск по ФИО или отделу..." class="form-control w-auto">
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
              </tr>
            </thead>
            <tbody id="reportsTableBody">
    `;

    if (users.length === 0) {
      html += `<tr><td colspan="6" class="text-center p-3">Нет данных</td></tr>`;
    } else {
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

        html += `
          <tr>
            <td>${user.name}</td>
            <td>${user.department || 'Не указан'}</td>
            <td>${stats.completedLessons} из ${stats.totalLessons}</td>
            <td>${stats.avgScore}%</td>
            <td>${stats.coursesCompleted}</td>
            <td>${lastDate}</td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    app.innerHTML = html;

    // Добавляем поиск
    document.getElementById('reportSearch').addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#reportsTableBody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  },

  // Экспорт отчётов в JSON
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
      `reports_${new Date().toISOString().slice(0,10)}.json`,
      JSON.stringify(reports, null, 2),
      'application/json'
    );
  },

  // Экспорт отчётов в CSV
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
      `reports_${new Date().toISOString().slice(0,10)}.csv`,
      csv,
      'text/csv'
    );
  }
};