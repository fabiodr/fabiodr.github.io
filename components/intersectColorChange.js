AFRAME.registerComponent('intersect-color-change', {
  init: function () {
    var el = this.el;
    var material = el.getAttribute('material');
    var initialColor = material.color;
    var self = this;

    // el.addEventListener('mousedown', function (evt) {
    //   el.setAttribute('material', 'color', '#EF2D5E');
    // });

    el.addEventListener('click', function () {
      console.log('intersect-color-change click');
      el.setAttribute('material', 'color', '#000000');
      self.isMouseEnter = false;
    });

    // el.addEventListener('raycaster-intersected', function () {
    //   //console.log('intersect-color-change raycaster-intersected');
    //   el.setAttribute('material', 'color', '#FFFFFF');
    //   self.isMouseEnter = false;
    // });

    el.addEventListener('mouseup', function (evt) {
      el.setAttribute('material', 'color', self.isMouseEnter ? '#24CAFF' : initialColor);
    });

    el.addEventListener('mouseenter', function () {
      console.log('intersect-color-change mouseenter');
      el.setAttribute('material', 'color', '#24CAFF');
      self.isMouseEnter = true;
    });

    el.addEventListener('mouseleave', function () {
      el.setAttribute('material', 'color', initialColor);
      self.isMouseEnter = false;
    });
  }
});

