AFRAME.registerComponent('random-entity-generator', {
  schema: {
    mixin: {default: ''},
    num: {default: 100},
    spread: {default: 20}
  },

  init: function () {
    var data = this.data;

    for (var i = 0; i < data.num; i++) {
      var entity = document.createElement('a-entity');
      entity.setAttribute('mixin', data.mixin);
      entity.setAttribute('class', 'intersectable');
      entity.setAttribute('intersect-color-change', '');

      entity.setAttribute('position', {
        x: getSpread(data.spread),
        y: getSpread(data.spread),
        z: getSpread(data.spread)
      });
      this.el.appendChild(entity);
    }
  }
});

function getSpread (spread) {
  return Math.random() * spread - spread / 2;
}
