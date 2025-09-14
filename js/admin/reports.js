/**
 * ADMIN/REPORTS.JS — Модуль отчётов
 * Отвечает за: рендеринг вкладки, просмотр статистики и экспорт отчётов
 */
const AdminReports = {
  // Рендеринг страницы отчётов
  renderTab() {
    const users = Users.getAllUsers();

    let html = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Отчёты по пользователям</h2>
          <p class="text-muted">Анализируйте прогресс обучения сотрудников.</p>
        </div>
        <div class="d-flex gap-2">
          <button onclick="AdminReports.exportJSON()" class="btn btn-secondary">Экспорт JSON</button>
          <button onclick="AdminReports.exportCSV()" class="btn btn-primary">Экспорт CSV</button>
        </div>
      </div>
      <div class="overflow-auto">
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
          <tbody>
    `;

    if (users.length === 0) {
      html += `<tr><td colspan="6" class="text-center">Нет данных для отображения</td></tr>`;
    } else {
      users.forEach(user => {
        const stats = Users.calculateUserStats(user.id);
        const progress = Users.getUserProgress(user.id);
        let lastDateTimestamp = 0;
        
        Object.values(progress).forEach(course => {
          Object.values(course).forEach(lesson => {
            if (lesson.passedAt > lastDateTimestamp) {
              lastDateTimestamp = lesson.passedAt;
            }
          });
        });

        const lastDate = lastDateTimestamp ? Users.formatDate(lastDateTimestamp) : 'Никогда';

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
    `;

    return html;
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
      const progress = Users.getUserProgress(user.id);
      let lastDateTimestamp = 0;
      
      Object.values(progress).forEach(course => {
          Object.values(course).forEach(lesson => {
              if (lesson.passedAt > lastDateTimestamp) {
                  lastDateTimestamp = lesson.passedAt;
              }
          });
      });

      const lastDate = lastDateTimestamp ? Users.formatDate(lastDateTimestamp) : '';

      csv += `"${user.id}","${user.name}","${user.department || ''}","${Users.formatDate(user.registeredAt)}","${stats.completedLessons}","${stats.totalLessons}","${stats.avgScore}","${stats.coursesCompleted}","${lastDate}"\n`;
    });

    Storage.downloadFile(
      `reports_${new Date().toISOString().slice(0,10)}.csv`,
      csv,
      'text/csv'
    );
  }
};
