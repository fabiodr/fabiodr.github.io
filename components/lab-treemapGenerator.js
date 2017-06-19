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

// var width = 960;
// var height = 1060;
// 5600/3456 - 2800/1728 - 1400/864
var width = 5600;
var height = 3456;
var offset = 1; //15

var maxHeight = 1.5;

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
  if(value < min) {
    return min;
  }

  if(value > max) {
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
    StockDataFetcher.get(function (data) {
      var format = d3.format(",d");

      // var colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      //   .domain([-4, 4]);

      var heightExtent = d3.extent(data, function (d) {
        return d[heightDimension.key];
      });

      console.log('extent', heightExtent);

      //heightDimension.scale.domain(heightExtent);

      // if(isChangeDimension) {
      //   var clippedMin = Math.max(heightExtent[0], -100);
      //   var clippedMax = Math.min(heightExtent[1], 100)
      //   console.log('d3.extent([clippedMin, clippedMax])', d3.extent([clippedMin, clippedMax]));
      //   heightDimension.scale.domain(d3.extent([clippedMin, clippedMax]));
      // }
      // else {
      //   heightDimension.scale.domain(heightExtent);
      // }

      if(isChangeDimension) {
        heightDimension.scale.domain([heightExtent[0], 0, heightExtent[1]]);//.clamp(true);
      }
      else {
        heightDimension.scale.domain(heightExtent);
      }

      var stratify = d3.stratify()
        .id(function (d) { return d.name; })
        .parentId(function (d) { return d.superSector; });
      //.parentId(function (d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

      // .paddingOuter(3)
      // .paddingTop(19)
      // .paddingInner(1)

      var treemap = d3.treemap()
        .size([width, height])
        .paddingInner(20) //5 break sectors in cascaded
        .paddingOuter(offset)
        .paddingTop(100)
        .round(false);

      var root = stratify(data)
        .sum(function (d) { return d[areaDimension]; })
        .sort(function (a, b) { return b.height - a.height || b[areaDimension] - a[areaDimension]; });


      treemap(root);
      //cascade(root, offset);

      // root.children.forEach(function (d, i) {
      //   that.createBox(d, i);
      // });

      // d3.select("body")
      //   .selectAll(".node")
      //   .data(root.descendants())
      //   .enter().append("div")
      //   .attr("class", function (d) { return "node" + (d.children ? " node--internal" : " node--left"); })
      //   .attr("title", function (d) { return d.id + "\n" + format(d.value); })
      //   .style("left", function (d) { return d.x0 + "px"; })
      //   .style("top", function (d) { return d.y0 + "px"; })
      //   .style("width", function (d) { return d.x1 - d.x0 + "px"; })
      //   .style("height", function (d) { return d.y1 - d.y0 + "px"; })
      //   .style("background", function (d) { return color(d.depth); })
      //   .each(function (d) { d.node = this; })
      //   .on("mouseover", hovered(true))
      //   .on("mouseout", hovered(false))
      //   .text(function (d) { return d.id.substring(d.id.lastIndexOf(".") + 1).split(/(?=[A-Z][^A-Z])/g).join("\u200b"); });

      // d3.select("body")
      //   .append('div')
      //   .attr("id", 'treemap')
      //   .selectAll(".node")
      //   .data(root.descendants())
      //   .enter().append("div")
      //   .attr("class", function (d) { return "node" + (d.children ? " node--internal" : " node--left"); })
      //   .attr("title", function (d) { return d.id + "\n" + format(d.value); })
      //   .style("left", function (d) { return d.x0 + "px"; })
      //   .style("top", function (d) { return d.y0 + "px"; })
      //   .style("width", function (d) { return d.x1 - d.x0 + "px"; })
      //   .style("height", function (d) { return d.y1 - d.y0 + "px"; })
      //   .style("background", function (d) { return colorScale(d.depth); })
      //   .text(function (d) { return d.id })
      //   .each(function (d) { 
      //     d.node = this;

      d3.select("body")
        .append('div')
        .attr("id", 'treemap')
        .selectAll(".node")
        .data(root.descendants())
        .enter()//.append("div")
        // .attr("class", function (d) { return "node" + (d.children ? " node--internal" : " node--left"); })
        // .attr("title", function (d) { return d.id + "\n" + format(d.value); })
        // .style("left", function (d) { return d.x0 + "px"; })
        // .style("top", function (d) { return d.y0 + "px"; })
        // .style("width", function (d) { return d.x1 - d.x0 + "px"; })
        // .style("height", function (d) { return d.y1 - d.y0 + "px"; })
        // .style("background", function (d) { return colorScale(d.depth); })
        // .text(function (d) { return d.id })
        .each(function (d) {
          d.node = this;

          that.createBox(d);
        });

      console.log('root.descendants()', root.descendants());
    });
  },
  createBox: function (d) {
    if (d.depth == 0) return;

    var el = document.createElement('a-box');

    let color;

    // if (item.superSector == 'Utilities') {
    //   color = '#006666';
    //   console.log('utilities enter');
    // }
    // else {
    //   color = '#FFFFFF';
    //   width += 1;
    //   height += 1;
    // }

    //box.material.color.set(colorScale(d.name));

    // var metrics = {
    //   x: d.x + (d.dx / 2) - width / 2,
    //   y: d.y + (d.dy / 2) - height / 2,
    //   z: 50, //zvalue / 2,
    //   w: Math.max(0, d.dx - 1),
    //   h: Math.max(0, d.dy - 1),
    //   d: 100
    // };

    // var coords = new TWEEN.Tween(box.position)
    //   .to({ x: newMetrics.x, y: newMetrics.y, z: newMetrics.z }, duration)
    //   .easing(TWEEN.Easing.Sinusoidal.InOut)
    //   .start();

    // var dims = new TWEEN.Tween(box.scale)
    //   .to({ x: newMetrics.w, y: newMetrics.h, z: newMetrics.d }, duration)
    //   .easing(TWEEN.Easing.Sinusoidal.InOut)
    //   .start();

    var xInitial = -3;
    var zInitial = -0.5;

    var adjustSize = 0.001;
    var x0 = d.x0 * adjustSize;
    var x1 = d.x1 * adjustSize;
    var y0 = d.y0 * adjustSize;
    var y1 = d.y1 * adjustSize;
    var xSize = (x1 - x0);
    var zSize = (y1 - y0);
    var x = xInitial + x0 + xSize / 2;
    var z = zInitial + y0 + zSize / 2;
    var scaledHeight = 0.1;

    if (d.depth > 1) {
      var rawHeight = d.data[heightDimension.key];
      //scaledHeight = Math.min(Math.abs(heightDimension.scale(rawHeight)), maxHeight);
      // if(isChangeDimension) {
      //   scaledHeight = rawHeight;
      // }
      // else {
        scaledHeight = heightDimension.scale(rawHeight);
      //}

      // if(scaledHeight > 0 && scaledHeight < 0.1 || scaledHeight < 0 && scaledHeight > -0.1) {
      //   scaledHeight *= 1.5;
      // }

      scaledHeight = clampExtent(scaledHeight, -maxHeight, maxHeight);
      //if(rawHeight < 0) { scaledHeight = -scaledHeight }
      //console.log('heightDimension', heightDimension.key, rawHeight, heightDimension, scaledHeight);
      console.log('height', rawHeight, scaledHeight);
    }

    el.setAttribute('id', 'block-' + d.id);
    el.setAttribute('position', { x: x, y: scaledHeight / 2, z: z });
    //el.setAttribute('scale', `${metrics.w} ${metrics.h} ${metrics.d}}`);
    el.setAttribute('width', xSize);
    el.setAttribute('height', scaledHeight);
    el.setAttribute('depth', zSize);

    el.setAttribute('material', 'color: red; transparent: true; opacity: 0.6; metalness: 0.8; roughness: 0.3;');

    //el.setAttribute('text__name', 'value: ' + d.id + '; color: #FFFFFF; baseline: top; align: center; wrapCount: 10; zOffset: 0.03;');

    // el.setAttribute('text__sector', `
    //       value: ${item.superSector};
    //       color: #FFFFFF;
    //       baseline: bottom;
    //       align: center;
    //       wrapCount: 10;
    //       zOffset: 0.03;
    //     `);
    // el.setAttribute('animation__scale', `property: scale; dir: alternate; dur: 200;
    //                         easing: easeInSine; loop: true; to: 1.2 1.2 1.2;
    //                         startEvents: mouseenter; pauseEvents: mouseleave;
    //                         resumeEvents: animationResume; restartEvents: animationRestart
    // `);

    this.el.sceneEl.appendChild(el);
  }
});
