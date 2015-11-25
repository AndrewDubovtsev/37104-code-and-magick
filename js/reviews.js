'use strict';

/* global reviews: true */

(function() {
  /**
   * Убирает класс или добавляет его
   * @param {boolean} action
   * @param {Element} element
   * @param {string} className
   */
  function toggleClass(action, element, className) {
    if (action) {
      element.className += ' ' + className;
    } else {
      element.className =
        element.className.replace(new RegExp(' ' + className, 'g'), '');
    }
  }

  /**
   * Конструктор
   * @param {Element} filter список фильтров
   * @param {Element} container контейнер для размещения списка отзывов
   * @param {Element} template шаблон для отзыва
   * @constructor
   */
  var ReviewsList = function(filter, container, template) {
    this.filter = filter;
    // Прячет список фильтров при инициализации списка отзывов
    toggleClass(true, this.filter, 'invisible');
    this.container = container;
    this.template = template;
    this.reviews = reviews;
  };

  ReviewsList.prototype = {
    /**
     * Создает список отзывов: изначально в DocumentFragment,
     * после этого в DOM.
     */
    templateAndAppend: function() {
      var template = this.template;
      var tempContainer = document.createDocumentFragment();
      for (var i = 0; i < this.reviews.length; i++) {
        var reviewTemplate;
        // Свойство 'content' у шаблонов не работает в IE, поскольку он
        // не поддерживает template. Поэтому для IE пишется альтернативный
        // вариант.
        // 'content' in template вернет true, если template является
        // объектом DocumentFragment, иначе шаблоны не поддерживаются, и это IE.
        if ('content' in template) {
          reviewTemplate = template.content.children[0].cloneNode(true);
        } else {
          reviewTemplate = template.children[0].cloneNode(true);
        }
        // Добавление изображения
        var author = reviewTemplate.querySelector('.review-author');
        this.uploadImage(this.reviews[i].author.picture, author, this.reviews[i].author.name);
        // Добавление рейтинга
        for (var j = 0; j < this.reviews[i].rating; j++) {
          var star = document.createElement('span');
          toggleClass(true, star, 'review-rating');
          reviewTemplate.insertBefore(star, reviewTemplate.querySelector('.review-text'));
        }
        reviewTemplate.querySelector('.review-text').textContent = this.reviews[i].description;
        tempContainer.appendChild(reviewTemplate);
      }
      this.container.appendChild(tempContainer);
      // Показывает фильтры у отзывов после загрузки списка отзывов
      toggleClass(false, this.filter, 'invisible');
    },

    /**
     * Обработчик изображений
     * @param {string} imageSrc адрес фотографии автора отзыва
     * @param {Element} author шаблон отзыва
     * @param {string} authorName имя автора
     * картинке с фотографией автора
     */
    uploadImage: function(imageSrc, author, authorName) {
      var IMAGE_SIZE = 124;
      var authorImage = new Image();
      var IMAGE_TIMEOUT = 10000;

      /**
       * Обработка изображения в случае зависания сервера
       */
      var imageLoadTimeout = setTimeout(function() {
        authorImage.src = '';
        //toggleClass(true, author.parentElement, 'review-load-failure');
      }, IMAGE_TIMEOUT);

      /**
       * Обработка изображения в случае успешной загрузки
       */
      authorImage.onload = function() {
        clearTimeout(imageLoadTimeout);
        authorImage.width = IMAGE_SIZE;
        authorImage.height = IMAGE_SIZE;
        toggleClass(true, authorImage, 'review-author');
        authorImage.setAttribute('alt', authorName);
        authorImage.setAttribute('title', authorName);
        author.parentElement.replaceChild(authorImage, author.parentElement.querySelector('img'));
      };

      /**
       * Обработка изображения в случае ошибки при загрузке
       */
      authorImage.onerror = function() {
        clearTimeout(imageLoadTimeout);
        author.parentElement.querySelector('img').setAttribute('alt', authorName);
        author.parentElement.querySelector('img').setAttribute('title', authorName);
        authorImage.src = '';
        if (author.parentElement.className.indexOf('review-load-failure') === -1) {
          toggleClass(true, author.parentElement, 'review-load-failure');
        }
      };

      authorImage.src = imageSrc;
    }
  };

  var reviewList = new ReviewsList(document.querySelector('.reviews-filter'),
  document.querySelector('.reviews-list'), document.querySelector('#review-template'));

  reviewList.templateAndAppend();
})();