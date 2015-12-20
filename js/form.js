/* global docCookies: true */
/* exported define */

'use strict';

define([ //eslint-disable-line no-undef
  'toggle-class'
], function(toggleClass) {

  var formContainer = document.querySelector('.overlay-container');
  var formOpenButton = document.querySelector('.reviews-controls-new');
  var formCloseButton = document.querySelector('.review-form-close');

  formOpenButton.onclick = function(evt) {
    evt.preventDefault();
    toggleClass(formContainer, 'invisible');
  };

  formCloseButton.onclick = function(evt) {
    evt.preventDefault();
    toggleClass(formContainer, 'invisible', true);
  };

  /**
   * Проверяет заполненность поля (в  него должен быть
   * введен хотя бы один символ).
   * @param {Element} element
   * @return {boolean}
   */
  function checkRequiredField(element) {
    return (typeof element === 'object') ?
       element.value.length !== 0 : element.length !== 0;
  }

  /**
   * Сохранение в cookies последних валидных значений оценки игры и
   * имени пользователя.
   * @param {string} username имя пользователя
   * @param {number} mark оценка
   */
  function setCookies(username, mark) {

    var currentDate = new Date();
    var currentYear = currentDate.getFullYear();
    var birthdayDate = new Date(currentYear, 2, 14);

    if (+currentDate - +birthdayDate < 0) {
      birthdayDate = new Date(currentYear - 1, 2, 14);
    }
    var timeToExpire = Math.ceil(+currentDate - +birthdayDate);
    /**
     * Дата истечения cookie
     * @type {string}
     */
    var dateToExpire = new Date(+currentDate + timeToExpire).toUTCString();
    docCookies.setItem('username', username, dateToExpire);
    docCookies.setItem('mark', mark, dateToExpire);
  }

  /**
   * Конструктор объекта Form.
   * @param {Element} form
   * @param {Element} controlList
   * @param {Element} submit
   * @param {NodeList} radios
   * @param {Element} username
   * @param {Element} review
   * @constructor
   */
  var Form = function(form, controlList, submit, radios, username, review) {
    this.form = form;
    this.controlList = controlList;
    this.submit = submit;
    this.username = username;
    this.review = review;
    this.radios = {
      buttons: radios,
      current: 0,
      limit: 3 // При этом значении ввод отзыва становится необязательным.
    };
    this.setSubmitDisabled(true);
    if (docCookies.getItem('username')) {
      this.setUsername(docCookies.getItem('username'));
    }
    if (docCookies.getItem('mark')) {
      this.radios.buttons[docCookies.getItem('mark') - 1].checked = true;
    }
    this.setCurrentMark = this.setCurrentMark.bind(this);
    this.setCurrentMark();
  };

  Form.prototype = {

    /**
     * Получение формы.
     * @return {Element} form
     */
    getForm: function() {
      return this.form;
    },

    /**
     * Получение submit.
     * @return {Element} submit
     */
    getSubmit: function() {
      return this.submit;
    },

    /**
     * Получение границы обязательности ввода отзыва.
     * @return {number} limit
     */
    getLimitReview: function() {
      return this.radios.limit;
    },

    /**
     * Установка атрибута disabled у submit.
     * @param {boolean} disabled
     */
    setSubmitDisabled: function(disabled) {
      this.getSubmit().disabled = disabled;
    },

    /**
     * Получение radio кнопок.
     * @return {NodeList} radios
     */
    getRadios: function() {
      return this.radios.buttons;
    },

    /**
     * Получение review.
     * @return {Element} review
     */
    getReview: function() {
      return this.review;
    },

    /**
     * Получение элемента имени пользователя.
     * @return {Element} username
     */
    getUsername: function() {
      return this.username;
    },

    /**
     * Установка имени пользователя.
     * @param {string} username
     */
    setUsername: function(username) {
      this.username.value = username;
    },

    /**
     * Получение текущей оценки.
     * @return {number}
     */
    getCurrentMark: function() {
      return this.radios.current;
    },

    /**
     * Установка текущей оценки игры.
     * @return {number} mark
     */
    setCurrentMark: function() {

      // Если оценка меньше 3, поле отзыва становится обязательным.
      // Если оно не заполнено, то ставим disabled на submit.
      for (var i = 0; i < this.getRadios().length; i++) {
        if (this.getRadios()[i].checked) {
          this.radios.current = this.getRadios()[i].value;
          break;
        }
      }

      this.formValidation(); // После установки текущей радиокнопки производится валидация полей.
    },

    /**
     * Валидация формы на основе текущей радиокнопки.
     * @return {number}
     */
    formValidation: function() {

      var result = 0;
      var currentMark = this.getCurrentMark();
      var radio = this.getRadios()[0];

      if (currentMark === 0) {

        // Оценка не поставлена, выводится сообщение о необходимости
        // проставления оценки.
        this.createErrorNode('Поставьте оценку', radio);
        this.setSubmitDisabled(true);
      } else if (currentMark <= (this.getLimitReview() - 1)) {
        // Удаление сообщения при непоставленной оценке
        this.removeErrorNode(radio);
        // Поле 'отзыв' становится обязательным, если оно не заполнено,
        // ставится disabled на submit (в методе validReview)
        result = this.validReview(true) && this.validUsername();
      } else {
        // Используется для удаления осталось заполнить - отзыв,
        // action - false, по умолчанию поле отзыв не обязательное.
        result = this.validUsername();
        // Вызов валидации отзыва
        this.validReview();
        if (result) {
          // Если имя заполнено и оценка >= 3, то форму можно отправлять, удаляем disabled.
          this.setSubmitDisabled(false);
        }
        // Удаляем ошибки от предыдущих вызовов, если они есть.
        this.removeErrorNode(this.getReview());
        this.removeErrorNode(radio);

      }

      return result;
    },

    /**
     * Получение контролов 'осталось заполнить'.
     * @return {Element} controlList
     */
    getControlList: function() {
      return this.controlList;
    },

    /**
     * Изменение значений элементов в 'осталось заполнить'.
     * @param {string} currentField
     * @param {boolean} action
     * action - при true скрываем элемент, иначе отображаем.
     */
    checkControlList: function(currentField, action) {

      var controlList = this.getControlList();
      var currentControl; // Получение текущего контрола.

      switch (currentField) {
        case 'username':
          currentControl = controlList.getElementsByClassName('review-fields-name')[0];
          break;
        case 'review':
          currentControl = controlList.getElementsByClassName('review-fields-text')[0];
          break;
      }

      toggleClass(currentControl, 'invisible', action); // Изменение статуса текущего элемента.

      // Проверка, совпадает ли число скрытых элементов с дочерними элементами контрольного листа.
      // Получение числа скрытых элементов.
      var countHiddenElements = controlList.getElementsByClassName('invisible').length;
      // Получение общего количества контролов
      var countAllControls = controlList.getElementsByClassName('review-fields-label').length;

      // Если true, то форма заполнена, все контролы скрыты, можно удалить disabled
      // с сабмита.
      if (countHiddenElements === countAllControls) {
        toggleClass(controlList, 'invisible', true);
        this.setSubmitDisabled(false); // Удаление disabled из сабмита в случае заполнения формы.
      } else {
        toggleClass(controlList, 'invisible');
      }

    },

    /**
     * Вставка в DOM элемента с сообщением об ошибке.
     * @param {string} errorMessage
     * @param {Element} currentField
     */
    createErrorNode: function(errorMessage, currentField) {
      var parent = currentField.parentElement;
      var children = parent.children;

      if (!parent.getElementsByClassName('form-error').length) {
        for (var i = 0; i < children.length; i++) {

          if (children[i].tagName === 'LABEL') {
            var error = document.createElement('span');
            error.className = 'review-form-label form-error';
            error.appendChild(document.createTextNode(errorMessage));
            parent.insertBefore(error, children[i].nextSibling);
            break;
          }

        }
      }
    },

    /**
     * Удаление из DOM элемента с сообщением об ошибке.
     * @param {Element} currentField
     */
    removeErrorNode: function(currentField) {
      var parent = currentField.parentElement;
      if (parent.getElementsByClassName('form-error').length) {
        parent.removeChild(parent.querySelector('.form-error'));
      }
    },

    /**
     * Валидация ввода имени пользователя в форму.
     * @return {boolean}
     */
    validUsername: function() {
      var currentField = 'username';

      if (!checkRequiredField(this.getUsername())) {

        this.setSubmitDisabled(true);
        // Вывод 'осталось заполнить - имя',
        // если оно скрыто.
        this.checkControlList(currentField, false);
        this.createErrorNode('Введите имя пользователя!', this.getUsername());  // Вывод сообщения с ошибкой.
        return false;
      } else {
        this.checkControlList(currentField, true);  // Удаление 'осталось заполнить имя' (display: none).
        this.removeErrorNode(this.getUsername());
        if (this.getCurrentMark() >= this.getLimitReview()) {
          this.setSubmitDisabled(false);
        }

        return true;

      }
    },

    /**
     * Валидация ввода отзыва в форму.
     * @param {boolean} action - нужно ли проверять на обязательность.
     */
    validReview: function(action) {

      var currentField = 'review';

      if (!checkRequiredField(this.getReview())) {

        if (action) { // Если поле обязательно, запрещаем сабмит, выводим ошибку.
          this.setSubmitDisabled(true);
          this.createErrorNode('Отзыв обязателен при оценке < 3!', this.getReview());
        }
        // Вывод 'осталось заполнить - отзыв',
        // если оно скрыто.
        this.checkControlList(currentField, false);
        return false;

      } else {

        this.checkControlList(currentField, true); // Удаление 'осталось заполнить отзыв' (display: none).
        this.removeErrorNode(this.getReview());
        return true;

      }
    }

  };

  var form = document.querySelector('.review-form');

  var controlList = document.querySelector('.review-fields');

  var submit = document.querySelector('.review-form-controls').getElementsByClassName('review-submit')[0];

  var radios = document.getElementsByName('review-mark');

  var username = document.getElementById('review-name');

  var review = document.getElementById('review-text');

  var reviewForm = new Form(form, controlList, submit, radios, username, review);

  /**
   * При изменении данных в поле ввода имени
   * вызывается валидация этого поля.
   */
  reviewForm.getUsername().onchange = function() {
    reviewForm.validUsername();
  };

  /**
   * При изменении данных в поле ввода отзыва
   * вызывается валидация формы.
   */
  reviewForm.getReview().onchange = function() {
    reviewForm.formValidation();
  };

  /**
   * На каждую радиокнопку навешивается обработчик события изменения,
   * устанавливающий текущую оценку игры пользоавтелем.
   */
  Array.prototype.forEach.call(reviewForm.getRadios(), function(radio) {
    radio.onchange = reviewForm.setCurrentMark;
  });

  // На сабмит - проверка ввода имени пользователя.
  // Проверка текущей оценки игры, при отсутствии заданной оценки просит задать.
  reviewForm.form.onsubmit = function(e) {

    e.preventDefault();
    if (reviewForm.formValidation()) { // Оценка задана, имя не пустое, отзыв обязателен при оценке меньше 3.
      setCookies(username.value, reviewForm.getCurrentMark());
      this.submit(); // Валидация прошла успешно, форма отправляется на сервер.
    }

  };

});
