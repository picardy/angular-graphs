'use strict';

angular.module('picardy.graphs.line', ['picardy.graphs.common'])
  .directive('d3GraphLine', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var options, d3Data, options, getColor, svg, margin, width, height, x, y, labels, axes, lines;

      if (!scope.data) {
        return;
      }

      options = angular.copy(scope.data);
      getColor = common.colors(options.colors);
      d3Data = [];


      angular.forEach(options.data, function (d) {
        if (d.x > 0) {
          d.x = new Date(d.x);
        }
        d3Data.push(d);
      });


      function drawAxes () {
        var xAxis, yAxis;

        /* X AXIS */
        xAxis = d3.svg.axis().
          scale(x).
          ticks(d3.time.daysTotal, options.dateStep).
          tickFormat(d3.time.format(options.dateFormat)).
          orient('bottom');

        axes.
          append('g').
            attr({
              'class': 'x axis',
              'transform': common.translate(margin.left, height)
            }).
            call(xAxis).
            selectAll('text').
              style('fill', getColor('axes')).
              attr('transform', common.translate(0, 10));

        /* Y AXIS */
        yAxis = d3.svg.axis().
          scale(y).
          orient('left');

        axes.
          append('g').
            attr({
              'class': 'y axis',
              'transform': common.translate(margin.left, 0)
            }).
            call(yAxis).
            selectAll('text').
              style('fill', getColor('axes'));

        axes.selectAll('.axis path, .axis line').
          style({
            'fill': 'none',
            'stroke': getColor('axes'),
            'shape-rendering': 'crispEdges'
          });
      }

      function drawLabels (yLabel) {
        labels.
          append('text').
            attr('transform', 'rotate(-90) ' + common.translate(0, margin.left + 20)).
            style({
              'text-anchor': 'end',
              'fill': getColor('labels')
            }).
            text(yLabel);
      }

      function drawLines () {
        var line, path, totalLength; //eslint-disable-line no-unused-vars

        line = d3.svg.line().
          interpolate('linear').
          x(function (d) {
            return x(d.x);
          }).
          y(function (d) {
            return y(d.y);
          });

        path = lines.append('path').
          datum(d3Data).
          attr({
            'transform': common.translate(margin.left, 0),
            'class': 'line',
            'd': line
          });

        totalLength = path.node().getTotalLength();

        lines.selectAll('.line').
          style({
            'fill': 'none',
            'stroke': getColor('lines'),
            'stroke-width': '1.5px'
          });
      }

      function drawGraph () {
          var unitLength;

          if (svg) {
            svg.remove();
          }

          common.defaults(options, {
            ratioWidth: 2,
            ratioHeight: 1,
            dateStep: 3,
            dateFormat: '%a %d'
          });

          options.width = element[0].getBoundingClientRect().width;
          unitLength = options.width / options.ratioWidth;
          options.height = options.ratioHeight * unitLength;

          svg = common.initSvg(element[0], options.width, options.height);

          labels = common.newLayer(svg, 'labels');
          lines = common.newLayer(svg, 'lines');
          axes = common.newLayer(svg, 'axes');

          margin = {top: 20, right: 20, bottom: 30, left: 50};
          width = options.width - margin.left - margin.right;
          height = options.height - margin.top - margin.bottom;

          x = d3.time.scale().range([0, width - 20]);
          y = d3.scale.linear().range([height, 20]);

          x.domain(d3.extent(d3Data, function (d) {
            return d.x;
          }));
          y.domain([0, d3.max(d3Data, function (d) {
            return d.y;
          })]);

          drawAxes();
          drawLabels(options.labels.y);
          drawLines();
      }

      drawGraph();

      common.onWindowResize(drawGraph);

    }

    return common.define($rootScope, render);
  }]);
