AFRAME.registerComponent('debug-bb', {
  schema: {
    color: { type: 'color' }
  },

  init: function () {
    var helper = new THREE.BoxHelper(this.el.getObject3D('mesh'), this.data.color);
    this.el.object3D.add(helper);
  }
});
