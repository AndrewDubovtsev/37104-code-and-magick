'use strict';

define([
  'photo',
  'video',
  'gallery'
], function(Photo, Video, Gallery) {

  var galleryImages = document.querySelectorAll('.photogallery-image');

  /**
   * Собираем массив объектов Photo из photogallery.
   * @type {Array}
   */

  var pictures = Array.prototype.map.call(galleryImages, function(pic) {
    return pic.dataset.replacementVideo ?
      new Video(pic.dataset.replacementVideo) : new Photo(pic.querySelector('img').src);
  });

  var gallery = new Gallery();

  gallery.setPictures(pictures);

  // При создании галереи вызывается метод, определяющий
  // изменение состояния хэша в адресной строке.
  gallery.restoreFromHash();

  // При клике на картинку изменяется хэш в адресной строке, что
  // вызывает показ галереи.
  Array.prototype.forEach.call(galleryImages, function(image, i) {
    image.addEventListener('click', function(e) {
      e.preventDefault();
      gallery.changeLocationHash(i);
    });
  });

});
