AFRAME.registerComponent('debug-raycaster', {
  schema: { speed: { default: 1 } },
  init: function () {
    console.log('debug-raycaster init');
    this.el.addEventListener('raycaster-intersected', function (els) {
      console.log('raycaster-intersection', els);
    });
  }
});
