var count = 0;
AFRAME.registerComponent('cancel-gravity', {
  dependencies: ['dynamic-body'],
  init: function () {
    var self = this;
    var el = this.el;

    // if (el.sceneEl.hasLoaded) {
    //   this.register();
    // } else {
    //   this.el.sceneEl.addEventListener('loaded', this.register.bind(this));
    // }
  },
  tick: function () {
    var self = this;
    var el = this.el;
    if (el.body) {
      el.body.force.y += 10;

      console.log('tick', new Date(), ++count, el.body.force);
    }
  },
  // register() {
  //   var self = this;
  //   var el = this.el;

  //   el.body.preStep = function () {

  //     // // Direction towards (0,0,0) // or an anchor
  //     // el.body.force.set(
  //     //   -el.body.position.x,
  //     //   -el.body.position.y,
  //     //   -el.body.position.z
  //     // ).normalize();

  //     // Set magnitude to 10
  //     el.body.force.scale(10, el.body.force);

  //     // Cancel gravity force from the world
  //     console.log('preStep', new Date(), ++count);


  //   }
  // }
});