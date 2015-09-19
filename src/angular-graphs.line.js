'use strict';

angular.module('picardy.graphs.line', ['picardy.graphs.common'])
  .directive('d3GraphLine', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var _data, d3Data, options, getColor, svg, parseDate, margin, width, height, x, y, labels, axes, lines;

      if (!scope.data) {
        return;
      }

      _data = angular.copy(scope.data);
      getColor = common.colors(_data.colors);
      d3Data = [];

      options = common.defaults(_data, {
        height: 300,
        delay: 500,
        duration: 1000
      });
      options.width = scope.width === undefined ? options.height * 2 : scope.width;

      svg = common.initSvg(element[0], options.width, options.height);

      labels = common.newLayer(svg, 'labels');
      lines = common.newLayer(svg, 'lines');
      axes = common.newLayer(svg, 'axes');

      margin = {top: 20, right: 20, bottom: 30, left: 50};
      width = options.width - margin.left - margin.right;
      height = options.height - margin.top - margin.bottom;

      parseDate = d3.time.format('%d-%b-%y').parse;

      angular.forEach(_data.data, function (d) {
        d.x = parseDate(d.x);
        d3Data.push(d);
      });

      x = d3.time.scale().range([0, width - 20]);
      y = d3.scale.linear().range([height, 20]);

      x.domain(d3.extent(d3Data, function (d) {
        return d.x;
      }));
      y.domain([0, d3.max(d3Data, function (d) {
        return d.y;
      })]);


      function drawAxes () {
        var xAxis, yAxis;

        /* X AXIS */
        xAxis = d3.svg.axis().
          scale(x).
          ticks(d3.time.days, 3).
          tickFormat(d3.time.format('%a %d')).
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

      function drawLines (delay, duration) {
        var path, totalLength, line;

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

        path.
          attr({
            'stroke-dasharray': totalLength + ' ' + totalLength,
            'stroke-dashoffset': totalLength
          }).
          transition().
            duration(duration).
            delay(delay).
            ease('linear').
            attr('stroke-dashoffset', 0);

        lines.selectAll('.line').
          style({
            'fill': 'none',
            'stroke': getColor('lines'),
            'stroke-width': '1.5px'
          });
      }

      svg.
        attr({
          'width': width + margin.left + margin.right,
          'height': height + margin.top + margin.bottom
        });

      drawAxes();
      drawLabels(_data.labels.y);
      drawLines(options.delay, options.duration);

    }

    return common.define($rootScope, render);
  }]);
