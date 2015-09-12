'use strict';

angular.module('picardy.graphs.line', ['picardy.graphs.common'])
  .directive('d3GraphLine', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var _data, d3Data, options, svg, parseDate, margin, width, height, x, y, labels, axes, lines;

      if (!scope.data) {
        return;
      }

      _data = angular.copy(scope.data);

      function getColor (type) {
        if (_data.colors && _data.colors[type]) {
          return _data.colors[type];
        }
        return 'black';
      }

      d3Data = [];

      options = {
        height: scope.height === undefined ? 300 : scope.height,
        delay: scope.delay === undefined ? 500 : scope.delay,
        duration: scope.duration === undefined ? 1000 : scope.duration
      };
      options.width = scope.width === undefined ? options.height * 2 : scope.width;

      svg = common.initSvg(element[0], options.width, options.height);

      labels = svg.append('g').attr('class', 'labels');
      axes = svg.append('g').attr('class', 'axes');
      lines = svg.append('g').attr('class', 'lines');

      margin = {top: 20, right: 20, bottom: 30, left: 50};
      width = options.width - margin.left - margin.right;
      height = options.height - margin.top - margin.bottom;

      parseDate = d3.time.format('%d-%b-%y').parse;

      angular.forEach(_data.x, function (val, i) {
        d3Data.push({
          x: parseDate(val),
          y: _data.y[i]
        });
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
            attr('class', 'x axis').
            attr('transform', 'translate(' + margin.left + ',' + height + ')').
            call(xAxis).
            selectAll('text').
              style('fill', getColor('axes')).
              attr('transform', 'translate(0,10)');

        /* Y AXIS */
        yAxis = d3.svg.axis().
          scale(y).
          orient('left');

        axes.
          append('g').
            attr('class', 'y axis').
            attr('transform', 'translate(' + margin.left + ',0)').
            call(yAxis).
            selectAll('text').
              style('fill', getColor('axes'));

        axes.selectAll('.axis path, .axis line').
          style('fill', 'none').
          style('stroke', getColor('axes')).
          style('shape-rendering', 'crispEdges');
      }

      function drawLabels () {
        labels.
          append('text').
            attr('transform', 'rotate(-90) translate(0,' + (margin.left + 20) + ')').
            style({
              'text-anchor': 'end',
              'fill': getColor('labels')
            }).
            text('Completion (%)');
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
          attr('transform', 'translate(' + margin.left + ',0)').
          attr('class', 'line').
          attr('d', line);

        totalLength = path.node().getTotalLength();

        path.
          attr('stroke-dasharray', totalLength + ' ' + totalLength).
          attr('stroke-dashoffset', totalLength).
          transition().
            duration(duration).
            delay(delay).
            ease('linear').
            attr('stroke-dashoffset', 0);

        lines.selectAll('.line').
          style('fill', 'none').
          style('stroke', getColor('lines')).
          style('stroke-width', '1.5px');
      }

      svg.
        attr('width', width + margin.left + margin.right).
        attr('height', height + margin.top + margin.bottom);

      drawAxes();
      drawLabels();
      drawLines(options.delay, options.duration);

    }

    return {
      restrict: 'E',
      scope: {
        render: '=',
        data: '=',
        width: '@',
        height: '@',
        duration: '@',
        delay: '@'
      },
      link: function (scope, element, attrs) {
        $rootScope[attrs.render] = function (data) {
          scope.data = data;
          render(scope, element, attrs);
        };
      }
    };
  }]);
