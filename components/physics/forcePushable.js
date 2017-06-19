AFRAME.registerComponent('force-pushable', {
  schema: {
    force: { default: 20 }
  },
  init: function () {
    this.pStart = new THREE.Vector3();
    this.sourceEl = this.el.sceneEl.querySelector('[camera]');
    this.el.addEventListener('click', this.forcePush.bind(this));
  },
  forcePush: function () {
    var force;
    var el = this.el;
    var pStart = this.pStart.copy(this.sourceEl.getAttribute('position'));
    var bodyPosition = new CANNON.Vec3().copy(el.getAttribute('position'));

    // Compute direction of force, normalize, then scale.
    force = el.body.position.vsub(pStart);
    console.log('force1', force)
    force.normalize();
    force.scale(this.data.force, force);
    console.log('force2', this.data.force, force, bodyPosition);
    el.body.applyImpulse(force, bodyPosition);
  }
});
