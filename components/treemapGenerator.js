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
//var scaleChange = d3.scaleLinear();
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

//var colorScale = d3.scaleOrdinal(d3.schemeCategory20c);

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
    var that = this;

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

          that.createBox(d);
        });

      //console.log('root.descendants()', root.descendants());
    });
  },
  createBox: function (d) {
    var adjustSize = 0.001;

    var x0 = d.x0 * adjustSize;
    var x1 = d.x1 * adjustSize;
    var y0 = d.y0 * adjustSize;
    var y1 = d.y1 * adjustSize;

    if (d.depth == 0) {
      // var middleAnchor = this.el.querySelector('#middleAnchor');
      // //console.log('middlean', an);
      // //var middleAnchor = document.createElement('a-box');
      // middleAnchor.setAttribute('id', 'middleAnchor');
      // middleAnchor.setAttribute('visible', 'false');
      // middleAnchor.setAttribute('position', { x: x1 / 2, y: 0, z: y1 / 2 });
      // this.el.appendChild(middleAnchor);

      return;
    }

    var xInitial = -2.8;//-3;
    var zInitial = -1.728;//-0.75;

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
      //el.setAttribute('material', 'color: ' + color + '; transparent: true; opacity: 0.7; metalness: 0.5; roughness: 0.9; shader: flat;');
      el.setAttribute('material', 'color: ' + color + '; transparent: true; opacity: 0.5; shader: flat;');

      this.el.appendChild(el);
    }
    else { // sectors
      var box = document.createElement('a-box');
      box.setAttribute('position', { x: x, y: 0, z: z });
      box.setAttribute('height', 0.001);
      box.setAttribute('width', xSize);
      box.setAttribute('depth', zSize);
      box.setAttribute('material', 'color: white; transparent: true; opacity: 0.2; metalness: 0.1; roughness: 1; depthTest: false;');
      this.el.appendChild(box);


      // el = document.createElement('a-text');
      // //el.setAttribute('material.wireframe', true);
      // el.setAttribute('position', { x: xInitial + x0, y: scaledHeight, z: zInitial + y0 });
      // el.setAttribute('side', 'double');
      // //el.setAttribute('rotation', '-90 0 0');
      // el.setAttribute('width', xSize * 2);
      // el.setAttribute('height', zSize * 2);
      // el.setAttribute('value', d.id);

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