/**
 * ADMIN/DASHBOARD.JS — Модуль главного дашборда админки
 * Отображает общую статистику по платформе
 */
const AdminDashboard = {
  renderTab() {
    const users = Users.getAllUsers();
    const courses = Storage.getCourses();
    const lessons = courses.flatMap(c => c.lessons);
    const completedLessons = users.reduce((total, user) => {
      const progress = Users.getUserProgress(user.id);
      return total + Object.values(progress).flatMap(p => Object.values(p)).filter(l => l.completed).length;
    }, 0);
    const totalLessonsToComplete = lessons.length * users.length;
    const overallProgress = totalLessonsToComplete > 0 ? Math.round((completedLessons / totalLessonsToComplete) * 100) : 0;

    let html = `
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
        <div class="col">
          <div class="card shadow-sm dashboard-card">
            <div class="card-body d-flex flex-column">
              <hgroup>
                  <h3>Пользователи</h3>
                  <p>Всего зарегистрировано</p>
              </hgroup>
              <div class="stat-number">${users.length}</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card shadow-sm dashboard-card">
            <div class="card-body d-flex flex-column">
              <hgroup>
                  <h3>Курсы</h3>
                  <p>Всего создано</p>
              </hgroup>
              <div class="stat-number">${courses.length}</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card shadow-sm dashboard-card">
            <div class="card-body d-flex flex-column">
              <hgroup>
                  <h3>Уроки</h3>
                  <p>Всего в системе</p>
              </hgroup>
              <div class="stat-number">${lessons.length}</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card shadow-sm dashboard-card">
            <div class="card-body d-flex flex-column">
              <hgroup>
                  <h3>Общий прогресс</h3>
                  <p>Процент прохождения</p>
              </hgroup>
              <div class="stat-number">${overallProgress}%</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card mt-4">
        <div class="card-body">
          <hgroup>
              <h3>Последние действия</h3>
              <p>Информация о последних действиях пользователей будет добавлена в будущем.</p>
          </hgroup>
          <div class="d-flex align-items-center" style="display: none !important;">
            <strong>Загрузка данных...</strong>
            <div class="spinner-border ms-auto" role="status" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    `;

    return html;
  },
};

