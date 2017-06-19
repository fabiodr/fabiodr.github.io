// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this, args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

var processingClap = false;

AFRAME.registerComponent('detect-clap', {
  schema: {
    debounce: {
      default: true
    },
    trigger: {
      default: 0.98
    }
  },

  init: function () {

    this.lastClap = (new Date()).getTime();
    this.timeout = -1;

    this.recording.prototype.destroy = function () {
      this.audioContext.destination.disconnect();
      this.audioContext = null;
    };

    var clap = (function clap() {
      console.log('clappppp');
      this.el.emit('clap');
      this.timeout = -1;
    }).bind(this);

    var clapclap = (function clapclap() {
      console.log('clap 2 clappppp');
      this.el.emit('clapclap');
      this.timeout = -1;
    }).bind(this);

    this.rec = new this.recording(function (data) {
      //console.log('this.recording callback');
      processingClap = true;
      var detected = this.detectClap(data);
      processingClap = false;
      if (detected) {
        clearTimeout(this.timeout);
        if (this.data.debounce) {
          if (this.timeout === -1) {
            console.log('setTimeout(clap, 500);');
            this.timeout = setTimeout(clap, 500);
          } else {
            console.log('setTimeout(clapclap, 500);');
            this.timeout = setTimeout(clapclap, 500);
          }
        } else {
          clap();
        }
      }
    }.bind(this));
  },

  remove: function () {
    this.rec.destroy();
    this.rec = null;
  },

  recording: function (cb) {
    var recorder = null;
    var recording = true;
    var audioInput = null;
    var volume = null;
    var audioContext = null;
    var callback = cb;
    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    if (navigator.getUserMedia) {
      console.log('has navigator.getUserMedia');
      navigator.getUserMedia({ audio: true }, function (e) {
        console.log('inside navigator.getUserMedia');
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        volume = this.audioContext.createGain(); // creates a gain node
        audioInput = this.audioContext.createMediaStreamSource(e); // creates an audio node from the mic stream
        recorder = this.audioContext.createScriptProcessor(2048, 1, 1);
        recorder.onaudioprocess = function (e) {
          //console.log('recorder.onaudioprocess');
          if (processingClap) return;

          processingClap = true;

          if (!recording) return;
          var left = e.inputBuffer.getChannelData(0);
          callback(new Float32Array(left));
        };
        audioInput.connect(volume);
        volume.connect(recorder);
        recorder.connect(this.audioContext.destination);
      }.bind(this), function (e) { //failure
        console.log(e);
      });
    } else {
      console.log('getUserMedia not supported in this browser.');
    }
  },

  detectClap: function detectClap(data) {
    processingClap = true;

    //console.log('function detectClap');
    var t = (new Date()).getTime();
    if (t - this.lastClap < 100) return false;
    var zeroCrossings = 0, highAmp = 0;
    //console.log('data.length', data.length);
    for (var i = 1; i < data.length; i++) {
      //console.log('Math.abs(data[i]', Math.abs(data[i]));
      if (Math.abs(data[i]) > this.data.trigger) highAmp++;
      if (
        data[i] > 0 && data[i - 1] < 0 ||
        data[i] < 0 && data[i - 1] > 0
      ) {
        zeroCrossings++;
      }
    }
    if (highAmp > 20 && zeroCrossings > 30) {
      this.lastClap = (new Date()).getTime();

      return true;
    }
    return false;
  }
});
