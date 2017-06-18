AFRAME.registerComponent('drag-rotate', {
  schema: { speed: { default: 1 } },
  init: function () {
    this.ifMouseDown = false;
    this.x_cord = 0;
    this.y_cord = 0;
    this.el.addEventListener('mousedown', this.onElementMouseDown.bind(this));
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this));
    document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
  },
  onElementMouseDown: function (event) {
    this.ifMouseDown = true;
    document.getElementById('camera').setAttribute('look-controls', 'enabled: false;');
  },
  onDocumentMouseDown: function (event) {
    //console.log('onDocumentMouseDown');
    this.x_cord = event.clientX;
    this.y_cord = event.clientY;
  },
  onDocumentMouseUp: function () {
    this.ifMouseDown = false;
    document.getElementById('camera').setAttribute('look-controls', 'enabled: true;');
  },
  onDocumentMouseMove: function (event) {
    //console.log('onDocumentMouseMove');
    if (this.ifMouseDown) {
      var temp_x = event.clientX - this.x_cord;
      var temp_y = event.clientY - this.y_cord;
      if (Math.abs(temp_y) < Math.abs(temp_x)) {
        this.el.object3D.rotateY(temp_x * this.data.speed / 1000);
      }
      else {
        this.el.object3D.rotateX(temp_y * this.data.speed / 1000);
      }
      this.x_cord = event.clientX;
      this.y_cord = event.clientY;
    }
  }
});

