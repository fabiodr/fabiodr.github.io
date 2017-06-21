AFRAME.registerComponent('drag-rotate', {
  schema: { speed: { default: 1 } },
  init: function () {
    this.ifMouseDown = false;
    this.x_axiscord = 0;
    this.y_axiscord = 0;

    this.x_cord = 0;
    this.y_cord = 0;
    this.axis = null;
    this.el.addEventListener('mousedown', this.onElementMouseDown.bind(this));
    this.el.addEventListener('click', function () { console.log('click el') });
    console.log('init drag-rotate');
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this));
    document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    document.addEventListener('axismove', this.onAxisMove.bind(this));
  },
  onElementMouseDown: function (event) {
    this.ifMouseDown = true;
    console.log('element mouse down');
    document.getElementById('camera').setAttribute('look-controls', 'enabled: false;');
  },
  onDocumentMouseDown: function (event) {
    console.log('onDocumentMouseDown');
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
  },
  onAxisMove: function (ev) {
    var ax = null;
    try {
      ax = ev.detail.axis;
    }
    catch (ex1) {
      ax = ev.axis;
    }

    try {
      if (this.ifMouseDown) {
        var temp_x = ax[0] - this.x_axiscord;
        var temp_y = ax[1] - this.y_axiscord;
        if (Math.abs(temp_y) < Math.abs(temp_x)) {
          this.el.object3D.rotateY(temp_x * this.data.speed / 1000);
        }
        else {
          this.el.object3D.rotateX(temp_y * this.data.speed / 1000);
        }
        this.x_axiscord = ax[0];
        this.y_axiscord = ax[1];
      }
    }
    catch (ex2) {
    }
  }
});

