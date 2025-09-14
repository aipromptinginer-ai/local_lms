/**
 * MODALS.JS — Модальные окна для файлов, изображений, видео
 * Открывает контент из папки files/ в модальных окнах
 */

const Modals = {
  // Открыть изображение
  openImage(src) {
    this.showModal(`
      <figure>
        <img src="${src}" alt="Изображение">
      </figure>
    `, 'modal-lg');
  },

  // Открыть файл (PDF, DOCX, PPTX и т.д.)
  openFile(src) {
    const ext = src.split('.').pop().toLowerCase();
    let content = '';

    if (ext === 'pdf') {
      content = `<iframe src="${src}" style="width: 100%; height: 80vh; border: none;" frameborder="0"></iframe>`;
    } else {
      content = `
        <div style="text-align: center; padding: 2rem;">
          <p>Предварительный просмотр для этого типа файла недоступен.</p>
          <a href="${src}" download class="btn btn-primary">Скачать файл</a>
        </div>
      `;
    }

    this.showModal(content, 'modal-lg');
  },

  // Открыть видео
  openVideo(src) {
    this.showModal(`
      <figure>
        <video controls autoplay>
          <source src="${src}" type="video/mp4">
          Ваш браузер не поддерживает воспроизведение видео.
        </video>
      </figure>
    `, 'modal-lg');
  },

  // Показать модальное окно с произвольным контентом
  showModal(content, sizeClass = '') {
    let dialog = document.getElementById('main-modal');
    if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.id = 'main-modal';
        document.body.appendChild(dialog);
    }

    dialog.innerHTML = `
      <div class="modal-dialog ${sizeClass}">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="btn-close" aria-label="Close" onclick="event.preventDefault(); Modals.closeModal()"></button>
          </div>
          <div class="modal-body" id="modal-content">
              ${content}
          </div>
        </div>
      </div>
    `;

    dialog.showModal();
  },

  // Закрыть модальное окно
  closeModal() {
    const dialog = document.getElementById('main-modal');
    if (dialog) {
      dialog.close();
    }
  }
};
