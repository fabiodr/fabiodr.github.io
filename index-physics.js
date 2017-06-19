require('./lib/aframe-master.js');

require('./components/debug/axis.js');
require('./components/debug/boundingBox.js');
require('aframe-log-component');


require('./components/physics/forcePushable.js');
require('./components/physics/pointGravity.js');
require('./components/physics/cancelGravity.js');
require('./components/physics/follow.js');

var physics = require('aframe-physics-system');
physics.registerAll();


//require('./components/detectClap.js');
