/**
 * STORAGE.JS — Работа с localStorage
 * Отвечает за: сохранение курсов, тестов, прогресса пользователей, импорт/экспорт
 */

const Storage = {
    // Загрузка курсов из localStorage (или дефолтных)
    loadCourses() {
      const saved = localStorage.getItem('courses');
      if (saved) {
        window.courses = JSON.parse(saved);
      } else {
        // Дефолтные курсы — можно заменить на пустой массив, если не нужны
        window.courses = [
          {
            id: 'course-001',
            title: 'Основы безопасности',
            description: 'Обязательный курс для всех сотрудников',
            lockUntilPassed: true,
            lessons: [
              {
                id: 'lesson-001',
                title: 'Введение в безопасность',
                content: `# Введение в безопасность\n\nДобро пожаловать в курс!\n\n[img:files/safety/equipment.jpg]\n\n[file:files/safety/manual.pdf]\n\n[quiz:quiz-001]`
              },
              {
                id: 'lesson-002',
                title: 'Практические навыки',
                content: `# Практические навыки\n\nОсвойте базовые действия.\n\n[video:files/safety/drill.mp4]\n\n[quiz:quiz-002]`
              }
            ]
          }
        ];
        this.saveCourses();
      }
    },
  
    // Сохранение курсов в localStorage
    saveCourses() {
      localStorage.setItem('courses', JSON.stringify(window.courses));
    },
  
    // Получение всех курсов
    getCourses() {
      return window.courses || [];
    },
  
    // Поиск курса по ID
    getCourse(id) {
      return this.getCourses().find(c => c.id === id);
    },
  
    // Добавление/обновление курса
    saveCourse(course) {
      const courses = this.getCourses();
      const index = courses.findIndex(c => c.id === course.id);
      if (index >= 0) {
        courses[index] = course;
      } else {
        courses.push(course);
      }
      window.courses = courses;
      this.saveCourses();
    },
  
    // Удаление курса
    deleteCourse(id) {
      window.courses = this.getCourses().filter(c => c.id !== id);
      this.saveCourses();
    },
  
    // --- Тесты ---
  
    // Загрузка тестов из localStorage
    loadQuizzes() {
      const saved = localStorage.getItem('quizzes');
      if (saved) {
        window.quizzes = JSON.parse(saved);
      } else {
        // Дефолтные тесты
        window.quizzes = [
          {
            id: 'quiz-001',
            title: 'Базовые знания',
            category: 'Безопасность',
            type: 'single',
            question: 'Что делать при пожаре?',
            options: ['Звонить 101', 'Прятаться под стол', 'Паниковать'],
            correct: [0],
            maxScore: 100,
            timeLimit: 0,
            maxAttempts: 3,
            passingScore: 80,
            shuffle: true
          },
          {
            id: 'quiz-002',
            title: 'Практические действия',
            category: 'Безопасность',
            type: 'multiple',
            question: 'Какие средства есть в аптечке?',
            options: ['Пластырь', 'Йод', 'Таблетки от головы', 'Жгут', 'Вата'],
            correct: [0, 1, 3, 4],
            maxScore: 100,
            timeLimit: 120,
            maxAttempts: 2,
            passingScore: 70,
            shuffle: true
          }
        ];
        this.saveQuizzes();
      }
    },
  
    // Сохранение тестов
    saveQuizzes() {
      localStorage.setItem('quizzes', JSON.stringify(window.quizzes));
    },
  
    // Получение всех тестов
    getQuizzes() {
      return window.quizzes || [];
    },
  
    // Получение теста по ID
    getQuiz(id) {
      return this.getQuizzes().find(q => q.id === id);
    },
  
    // Сохранение теста
    saveQuiz(quiz) {
      const quizzes = this.getQuizzes();
      const index = quizzes.findIndex(q => q.id === quiz.id);
      if (index >= 0) {
        quizzes[index] = quiz;
      } else {
        quizzes.push(quiz);
      }
      window.quizzes = quizzes;
      this.saveQuizzes();
    },
  
    // Удаление теста
    deleteQuiz(id) {
      window.quizzes = this.getQuizzes().filter(q => q.id !== id);
      this.saveQuizzes();
    },
  
    // --- Прогресс пользователей ---
  
    // Получение прогресса пользователя по курсу
    getUserProgress(userId, courseId) {
      const key = `progress_${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const allProgress = JSON.parse(saved);
        return allProgress[courseId] || {};
      }
      return {};
    },
  
    // Сохранение прогресса урока
    saveUserProgress(userId, courseId, lessonId, data) {
      const key = `progress_${userId}`;
      const saved = localStorage.getItem(key) || '{}';
      const allProgress = JSON.parse(saved);
  
      if (!allProgress[courseId]) {
        allProgress[courseId] = {};
      }
  
      allProgress[courseId][lessonId] = {
        ...data,
        updatedAt: Date.now()
      };
  
      localStorage.setItem(key, JSON.stringify(allProgress));
    },
  
    // Сохранение результата теста
    saveQuizResult(userId, quizId, result) {
      const key = `quiz_results_${userId}`;
      const saved = localStorage.getItem(key) || '{}';
      const results = JSON.parse(saved);
  
      if (!results[quizId]) {
        results[quizId] = [];
      }
  
      results[quizId].push({
        ...result,
        timestamp: Date.now()
      });
  
      localStorage.setItem(key, JSON.stringify(results));
    },

    // Сброс всех попыток прохождения теста для пользователя и теста
    resetQuizAttempts(userId, quizId) {
      const key = `quiz_results_${userId}`;
      const saved = localStorage.getItem(key) || '{}';
      let results = JSON.parse(saved);

      if (results[quizId]) {
        delete results[quizId]; // Удаляем все записи для конкретного теста
        localStorage.setItem(key, JSON.stringify(results));
      }
    },

    // Получение всех попыток прохождения теста
    getQuizAttempts(userId, quizId) {
      const key = `quiz_results_${userId}`;
      const saved = localStorage.getItem(key) || '{}';
      const results = JSON.parse(saved);
      return results[quizId] ? results[quizId].length : 0;
    },
  
    // Получение последнего результата теста
    getLastQuizResult(userId, quizId) {
      const key = `quiz_results_${userId}`;
      const saved = localStorage.getItem(key) || '{}';
      const results = JSON.parse(saved);
      const attempts = results[quizId] || [];
      return attempts.length > 0 ? attempts[attempts.length - 1] : null;
    },
  
    // --- Экспорт/Импорт ---
  
    // Экспорт курсов в JSON
    exportCourses() {
      const data = JSON.stringify(window.courses, null, 2);
      this.downloadFile('courses_export.json', data, 'application/json');
    },
  
    // Импорт курсов из JSON
    importCourses(jsonString) {
      try {
        const courses = JSON.parse(jsonString);
        if (Array.isArray(courses)) {
          window.courses = courses;
          this.saveCourses();
          alert('Курсы успешно импортированы!');
          return true;
        }
      } catch (e) {
        alert('Ошибка при импорте курсов: ' + e.message);
      }
      return false;
    },
  
    // Экспорт тестов в JSON
    exportQuizzes() {
      const data = JSON.stringify(window.quizzes, null, 2);
      this.downloadFile('quizzes_export.json', data, 'application/json');
    },
  
    // Импорт тестов из JSON
    importQuizzes(jsonString) {
      try {
        const quizzes = JSON.parse(jsonString);
        if (Array.isArray(quizzes)) {
          window.quizzes = quizzes;
          this.saveQuizzes();
          alert('Тесты успешно импортированы!');
          return true;
        }
      } catch (e) {
        alert('Ошибка при импорте тестов: ' + e.message);
      }
      return false;
    },
  
    // Экспорт отчётов по пользователям
    exportReports() {
      const reports = {};
      // Собираем все ключи progress_*
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('progress_')) {
          const userId = key.replace('progress_', '');
          reports[userId] = JSON.parse(localStorage.getItem(key));
        }
      }
  
      const data = JSON.stringify(reports, null, 2);
      this.downloadFile(`reports_${new Date().toISOString().slice(0,10)}.json`, data, 'application/json');
    },
  
    // Экспорт в CSV (простая версия)
    exportReportsCSV() {
      let csv = 'User ID,User Name,Course ID,Lesson ID,Completed,Score,Date\n';
  
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('progress_')) {
          const userId = key.replace('progress_', '');
          const progress = JSON.parse(localStorage.getItem(key));
  
          // Пытаемся найти имя пользователя
          const user = JSON.parse(localStorage.getItem('currentUser'));
          const userName = user && user.id === userId ? user.name : userId;
  
          for (const courseId in progress) {
            for (const lessonId in progress[courseId]) {
              const lesson = progress[courseId][lessonId];
              csv += `"${userId}","${userName}","${courseId}","${lessonId}","${lesson.completed || false}","${lesson.score || 0}","${new Date(lesson.updatedAt || 0).toLocaleString()}"\n`;
            }
          }
        }
      }
  
      this.downloadFile(`reports_${new Date().toISOString().slice(0,10)}.csv`, csv, 'text/csv');
    },
  
    // Вспомогательная функция: скачивание файла
    downloadFile(filename, content, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  
    // Генерация уникального ID
    generateId(prefix = 'item') {
      return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  };