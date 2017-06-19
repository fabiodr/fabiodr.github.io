var d3 = require('d3');
var d3scale = require('d3-scale');

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
      el.setAttribute('position', { x: x, y: finalHeight, z: z });
      el.setAttribute('height', scaledHeight);
      el.setAttribute('width', xSize);
      el.setAttribute('depth', zSize);
      el.setAttribute('material', 'color: ' + color + '; transparent: true; opacity: 0.7; shader: flat;');

      var positionAnimation;
      var opacityAnimation;

      el.addEventListener('mouseenter', function () {
        cardInfo.setAttribute('visible', 'true');
        cardTitle.setAttribute('value', d.id);
        var position = el.getAttribute('position');
        var opacity = el.getAttribute('material');

        // positionAnimation = new AFRAME.TWEEN.Tween(position)
        //   .to({ x: position.x, y: position.y + 0.5, z: position.z }, 500)
        //   .delay(0.2)
        //   .easing(TWEEN.Easing.Quadratic.InOut)
        //   .onUpdate(() => el.setAttribute('position', position))
        //   .onComplete(() => {
        //     console.log('anim finish');
        //   })
        //   .start();

        // var opacityAnimation = new AFRAME.TWEEN.Tween(opacity)
        //   .to({ opacity: 2 }, 500)
        //   .delay(0.2)
        //   .easing(TWEEN.Easing.Quadratic.InOut)
        //   .onUpdate(function () {
        //     el.setAttribute('material', 'opacity', opacity.opacity);
        //   })
        //   .start();
      });

      el.addEventListener('mouseleave', function () {
        // cardTitle.setAttribute('value', d.id);
        // var position = el.getAttribute('position');

        // if (positionAnimation) {
        //   positionAnimation.stop();
        // }
        // positionAnimation = new AFRAME.TWEEN.Tween(position)
        //   .to({ x: position.x, y: position.y - 0.5, z: position.z }, 500)
        //   .delay(0.2)
        //   .easing(TWEEN.Easing.Quadratic.InOut)
        //   .onUpdate(() => el.setAttribute('position', position))
        //   .start();

        // cardInfo.setAttribute('visible', 'false');
      });

      // this.flyTweenRotation = new TWEEN.Tween(rotation)
      //     .to({ x:0, y: 0, z: 0 }, speed)
      //     .delay(delay)
      //     .easing(TWEEN.Easing.Quadratic.InOut)
      //     .onUpdate(() => player.setAttribute('rotation', rotation))
      //     .onComplete(() => {
      //         this.isFirstTime = false;
      //         document.dispatchEvent(new Event('INTRO_COMPLETED'));
      //     });

      this.el.appendChild(el);
    }
    else { // sectors
      var box = document.createElement('a-box');
      box.setAttribute('position', { x: x, y: 0, z: z });
      box.setAttribute('height', 0.001);
      box.setAttribute('width', xSize);
      box.setAttribute('depth', zSize);
      box.setAttribute('material', 'color: white; transparent: true; opacity: 0.5; metalness: 0.1; roughness: 1; depthTest: false;');
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