var d3 = require('d3');
var anime = require('animejs');
var numeral = require('numeral');

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
    var cardVolume = this.cardVolume = this.el.sceneEl.querySelector('#cardVolume');
    var cardMarketCap = this.cardMarketCap = this.el.sceneEl.querySelector('#cardMarketCap');
    var cardVolume = this.cardVolume = this.el.sceneEl.querySelector('#cardVolume');
    var cardPrice = this.cardPrice = this.el.sceneEl.querySelector('#cardPrice');

    //console.log('init treemap-generator');
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

      // var pos = self.el.getAttribute('position');
      // console.log(pos, pos.x + ' ' + (pos.y - 0.5) + ' ' + pos.z);
      // self.el.setAttribute('anime__position',
      //   {
      //     property: 'position',
      //     dur: 2000,
      //     dir: 'normal',
      //     //from: pos.x + ' ' + (pos.y - 5) + ' ' + pos.z,
      //     to: pos.x + ' ' + (pos.y + 5) + ' ' + pos.z,
      //     easing: 'easeInOutQuart'
      //     //delay: 7000
      //   });


      //         translateX: {
      //   value: 250,
      //   duration: 800
      // },
      // rotate: {
      //   value: 360,
      //   duration: 1800,
      //   easing: 'easeInOutSine'
      // },
      // scale: {
      //   value: 2,
      //   duration: 1600,
      //   delay: 800,
      //   easing: 'easeInOutQuart'
      // },
      // delay: 250 
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
        scaledHeight = 0.02; // so it don't overlap with sector plane
      }

      color = (rawHeight >= 0) ? 'aqua' : 'red';

      //console.log('height', rawHeight, scaledHeight, d.value);
      var companyOffsetFromPlane = 0.05;

      el = document.createElement('a-box');
      var finalHeight = scaledHeight / 2;
      if (finalHeight > 0) {
        finalHeight += companyOffsetFromPlane;
      }
      else {
        finalHeight -= companyOffsetFromPlane;
      }

      var position = { x: x, y: finalHeight, z: z };

      el.setAttribute('position', position);
      el.setAttribute('height', scaledHeight);
      el.setAttribute('width', xSize);
      el.setAttribute('depth', zSize);
      el.setAttribute('material', 'color: ' + color + '; transparent: true; opacity: 0.7; shader: flat;');

      var elavation = 0.2;
      var animYPosition = (position.y > 0) ? position.y + elavation : position.y - elavation;

      el.setAttribute('anime__position',
        {
          property: 'position',
          dur: 200,
          to: position.x + ' ' + animYPosition + ' ' + position.z,
          restartEvents: 'animeposition',
          reverseEvents: 'animereverseposition',
          autoplay: false
        });

      // el.setAttribute('anime__rotation',
      //   {
      //     property: 'rotation',
      //     dur: 1500,
      //     to: '0 360 0',
      //     startEvents: 'anime__position-complete',
      //     reverseEvents: 'animereverseposition',
      //     loop: true,
      //     autoplay: false
      //   });

      el.addEventListener('mouseenter', function () {
        //console.log('mouseenter', animatingBlock);
        if (animatingBlock) return;

        animatingBlock = true;

        cardInfo.setAttribute('visible', 'true');
        cardTitle.setAttribute('value', d.id);
        cardChange.setAttribute('value', numeral(d.data.change).format('0.0') + '%');
        cardMarketCap.setAttribute('value', numeral(d.data.marketCap).format('0.0a'));
        cardVolume.setAttribute('value', numeral(d.data.volume).format('0.0a'));
        cardPrice.setAttribute('value', numeral(d.data.price).format('0.00'));

        var opacity = el.getAttribute('material');

        el.emit('animeposition');

        // console.log('property: position; dir: normal; dur: 200; to: '
        //   + round(position.x) + ' ' + round(animYPosition) + ' ' + round(position.z));
      });

      el.addEventListener('anime__position-complete', function () {
        animatingBlock = false;
        //console.log('animationcomplete');
      });

      el.addEventListener('mouseleave', function () {
        if (animatingBlock) return;
        //console.log('mouseleave', el.getAttribute('anime__position'));
        setTimeout(function () {
          el.emit('animereverseposition');
        }, 500);

        // var anime = el.components['anime__position'];
        // if(anime) {
        //   anime.reverseAnimation();
        // }
      });

      this.el.appendChild(el);
    }
    else { // sectors
      var box = document.createElement('a-box');
      box.setAttribute('position', { x: x, y: 0, z: z });
      box.setAttribute('height', 0.001);
      box.setAttribute('width', xSize);
      box.setAttribute('depth', zSize);
      box.setAttribute('material', 'color: white; transparent: true; opacity: 0.7; depthWrite: false;'); //depthTest: false; depthWrite: true; shader: flat;
      box.setAttribute('class', 'intersectable');
      this.el.appendChild(box);

      //var scaledHeight = 0.1;

      this.el.appendChild(
        createText({
          x: xInitial + x0,
          y: 0,
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
          y: 0,
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