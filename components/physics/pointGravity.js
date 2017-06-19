AFRAME.registerComponent('point-gravity', {
  dependencies: ['dynamic-body'],
  schema: {
    force: { default: 50 }
  },
  init: function () {
    var self = this;
    var el = this.el;

    if (el.sceneEl.hasLoaded) {
      this.register();
    } else {
      this.el.sceneEl.addEventListener('loaded', this.register.bind(this));
    }
  },
  register() {
    var self = this;
    var el = this.el;

    var gravityAnchor = this.gravityAnchor = el.sceneEl.querySelector('#gravityAnchor');
    console.log('gravityAnchor', gravityAnchor);

    var g = 6.674;
    anchorMass = 10;

    //console.log('el.body', el.body);
    el.body.postStep = function () {
      //console.log('preStep physics', this);

      // Get the vector pointing from me to other
      var meToOther = new CANNON.Vec3()
      gravityAnchor.body.position.vsub(el.body.position, meToOther)
      meToOther.normalize()

      // Get distance from me to other
      var distanceSquared = el.body.position.distanceSquared(gravityAnchor.body.position)

      // apply scalar
      var scaledForce = new CANNON.Vec3()
      meToOther.scale(g * el.body.mass * anchorMass / distanceSquared, scaledForce)

      //console.log('distanceSquared', meToOther, el.body.mass, anchorMass, distanceSquared, scaledForce);

      el.body.applyForce(
        scaledForce,
        new CANNON.Vec3().copy(el.getAttribute('position'))
      )
    }
  }
});


//cancel gravity
// function () {

//     // Direction towards (0,0,0)
//     playerBody.force.set(
//         -playerBody.position.x,
//         -playerBody.position.y,
//         -playerBody.position.z
//     ).normalize();

//     // Set magnitude to 10
//     playerBody.force.scale(10, playerBody.force);

//     // Cancel gravity force from the world
//     playerBody.force.y += 10;

// }