var d3 = require('d3');
var d3scale = require('d3-scale');

function round(num) {
  return Math.round(num * 100) / 100;
}

function generateUID() {
    // I generate the UID from two parts here 
    // to ensure the random number provide enough bits.
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

function cascade(root, offset) {
  return root.eachAfter(function (d) {
    if (d.children) {
      d.heightRight = 1 + d3.max(d.children, function (c) { return c.x1 === d.x1 - offset ? c.heightRight : NaN; });
      d.heightBottom = 1 + d3.max(d.children, function (c) { return c.y1 === d.y1 - offset ? c.heightBottom : NaN; });
    } else {
      d.heightRight =
        d.heightBottom = 0;
    }
  }).eachBefore(function (d) {
    d.x1 -= 2 * offset * d.heightRight;
    d.y1 -= 2 * offset * d.heightBottom;
  });
}

// 960/1060;
// 5600/3456 - 2800/1728 - 1400/864
var width = 5600;
var height = 3456;
var offset = 1; //15

var maxHeight = 3;

var scaleMarketCap = d3.scaleLinear().range([0, maxHeight]);
var scalePrice = d3.scaleLinear().range([0, maxHeight]);
var scaleVolume = d3.scaleLinear().range([0, maxHeight]);
var scaleChange = d3.scaleLinear().range([-maxHeight, 0, maxHeight]);

var areaDimension = 'marketCap';
var heightDimensionOptions = {
  marketCap: { key: 'marketCap', scale: scaleMarketCap },
  price: { key: 'price', scale: scalePrice },
  volume: { key: 'volume', scale: scaleVolume },
  change: { key: 'change', scale: scaleChange },
};
var heightDimension = heightDimensionOptions.change;

var isChangeDimension = heightDimension.key === 'change';

function clampExtent(value, min, max) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

var colorScale = d3.scaleSequential(d3.interpolateMagma)
  .domain([-4, 4]);

var animatingBlock = false;

AFRAME.registerComponent('treemap-generator', {
  schema: {
    mixin: { default: '' },
    num: { default: 100 },
    spread: { default: 20 }
  },

  init: function () {
    var self = this;

    var cardInfo = this.cardInfo = this.el.sceneEl.querySelector('#cardInfo');
    var cardTitle = this.cardTitle = this.el.sceneEl.querySelector('#cardTitle');

    console.log('init treemap-generator');
    stockDataFetcher.get(function (data) {
      var format = d3.format(",d");

      var heightExtent = d3.extent(data, function (d) {
        return d[heightDimension.key];
      });

      if (isChangeDimension) {
        heightDimension.scale.domain([heightExtent[0], 0, heightExtent[1]]);
        //.clamp(true);
      }
      else {
        heightDimension.scale.domain(heightExtent);
      }

      var stratify = d3.stratify()
        .id(function (d) { return d.name; })
        .parentId(function (d) { return d.superSector; });

      var treemap = d3.treemap()
        .tile(d3.treemapSquarify) //treemapSquarify / treemapSliceDice / treemapBinary
        .size([width, height])
        .paddingInner(100)
        //.paddingOuter(offset)
        //.paddingTop(50)
        .round(false);


      var threshold = 0;
      var root = stratify(data)
        .sum(function (d) { return d[areaDimension] + threshold; })
        .sort(function (a, b) { return b.height - a.height || (b[areaDimension] + threshold) - (a[areaDimension] + threshold); });

      treemap(root);

      d3.select("body")
        .append('div')
        .attr("id", 'treemap')
        .selectAll(".node")
        .data(root.descendants())
        .enter()
        .each(function (d) {
          d.node = this;

          self.createBox(d);
        });
    });
  },
  createBox: function (d) {
    var adjustSize = 0.001;

    var x0 = d.x0 * adjustSize;
    var x1 = d.x1 * adjustSize;
    var y0 = d.y0 * adjustSize;
    var y1 = d.y1 * adjustSize;

    if (d.depth == 0) {
      return;
    }

    var xInitial = -2.8;
    var zInitial = -1.728;

    var xSize = (x1 - x0);
    var zSize = (y1 - y0);
    var x = xInitial + x0 + xSize / 2;
    var z = zInitial + y0 + zSize / 2;
    var scaledHeight;
    var color;
    var el;

    if (d.depth > 1) { // companies
      var rawHeight = d.data[heightDimension.key];
      scaledHeight = heightDimension.scale(rawHeight);
      scaledHeight = clampExtent(scaledHeight, -maxHeight, maxHeight);

      if (scaledHeight === 0) {
        scaledHeight = 0.05;
      }

      color = (rawHeight >= 0) ? 'aqua' : 'red';

      //console.log('height', rawHeight, scaledHeight, d.value);

      el = document.createElement('a-box');
      var finalHeight = scaledHeight / 2;
      if (finalHeight > 0) {
        finalHeight += 0.1;
      }
      else {
        finalHeight -= 0.1;
      }

      var position = { x: x, y: finalHeight, z: z };

      el.setAttribute('position', position);
      el.setAttribute('height', scaledHeight);
      el.setAttribute('width', xSize);
      el.setAttribute('depth', zSize);
      el.setAttribute('material', 'color: ' + color + '; transparent: true; opacity: 0.7; shader: flat;');

      var elavation = 0.4;
      var animYPosition = (height > 0) ? position.y + elavation : position.y - elavation;

      var id = generateUID();
      var animPositionEventName = 'anim-position' + id;

      el.setAttribute('animation__position' + id,
        {
          property: 'position',
          dur: 200,
          to: round(position.x) + ' ' + round(animYPosition) + ' ' + round(position.z),
          startEvents: animPositionEventName
        });

      el.setAttribute('animation__positionreverse' + id,
        {
          property: 'position',
          dur: 200,
          to: position.x + ' ' + position.y + ' ' + position.z,
          startEvents: animPositionEventName + '-reverse' + ', newAnimationStarting'
        });

      el.addEventListener('animation__position' + id + '-complete', function (evt) {
        console.log('animation__position' + id + '-complete');
        animatingBlock = false;
      });

      el.addEventListener('animation__positionreverse' + id + '-complete', function (evt) {
        console.log('animation__positionreverse' + id + '-complete');
        animatingBlock = false;
      });

      el.addEventListener('mouseenter', function () {
        console.log('mouseenter', animatingBlock);
        if(animatingBlock) return;

        el.sceneEl.emit('newAnimationStarting');

        animatingBlock = true;

        cardInfo.setAttribute('visible', 'true');
        cardTitle.setAttribute('value', d.id);

        var opacity = el.getAttribute('material');

        el.emit(animPositionEventName);

        // console.log('property: position; dir: normal; dur: 200; to: '
        //   + round(position.x) + ' ' + round(animYPosition) + ' ' + round(position.z));
      });

      el.addEventListener('mouseleave', function () {
        if(animatingBlock) return;
        console.log('mouseleave', el.getAttribute('animation__position'));
        el.emit(animPositionEventName + '-reverse');
      });

      this.el.appendChild(el);
    }
    else { // sectors
      var box = document.createElement('a-box');
      box.setAttribute('position', { x: x, y: 0, z: z });
      box.setAttribute('height', 0.001);
      box.setAttribute('width', xSize);
      box.setAttribute('depth', zSize);
      box.setAttribute('material', 'color: white; transparent: true; opacity: 0.5; depthTest: false;shader: flat; ');
      this.el.appendChild(box);

      var scaledHeight = 0.1;

      this.el.appendChild(
        createText({
          x: xInitial + x0,
          y: scaledHeight + 0.01,
          z: zInitial + y0,
          width: xSize * 2,
          height: zSize * 2,
          text: d.id,
          id: d.id + '-text-side-a',
          rotation: '-90 0 0',
          side: 'front'
        })
      );

      this.el.appendChild(
        createText({
          x: xInitial + x0,
          y: -scaledHeight - 0.01,
          z: zInitial + y0,
          width: xSize * 2,
          height: zSize * 2,
          text: d.id,
          id: d.id + '-text-side-b',
          rotation: '90 0 0',
          side: 'front'
        })
      );
    }
  }
});


function createText(props) { // x, y, z, width, height, text, id, rotation, side
  var el = document.createElement('a-text');
  el.setAttribute('position', { x: props.x, y: props.y, z: props.z });
  el.setAttribute('side', props.side);
  el.setAttribute('baseline', 'bottom');
  el.setAttribute('width', props.width);
  el.setAttribute('height', props.height);
  el.setAttribute('scale', '1.4 1.4 0');
  el.setAttribute('value', props.text);
  el.setAttribute('id', props.id);

  if (props.rotation) {
    el.setAttribute('rotation', props.rotation);
  }

  return el;
}