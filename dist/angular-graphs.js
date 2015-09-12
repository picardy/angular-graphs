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

'use strict';

angular.module('picardy.graphs.pie', ['picardy.graphs.common'])
  .directive('d3GraphPie', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var _data, d3Data, options, svg, slices, labels, lines, text, min, radius, pie, innerArc, outerArc, percentage;

      if (!scope.data) {
        return;
      }

      _data = angular.copy(scope.data);

      function getColor (type, i) {
        if (_data.colors && _data.colors[type]) {
          if (type === 'slices') {
            if (_data.colors.slices) {
              return _data.colors.slices[i];
            } else {
              return d3.scale.category10().range()[i];
            }
          }
          return _data.colors[type];
        }
        return 'black';
      }

      d3Data = {start: [], end: []};

      options = {
        labels: _data.labels && _data.labels.length,
        height: _data.width === undefined ? 300 : _data.width,
        delay: _data.delay === undefined ? 500 : _data.delay,
        duration: _data.duration === undefined ? 1000 : _data.duration
      };
      options.width = _data.width === undefined ? options.height + (options.labels ? 200 : 0) : _data.width;

      svg = common.initSvg(element[0], options.width, options.height);

      angular.forEach(_data.start, function (val, i) {
        var label = options.labels ? _data.labels[i] : Math.random(),
            color = getColor('slices', i);

        d3Data.start.push({
          value: _data.start[i],
          label: label,
          color: color
        });

        d3Data.end.push({
          value: _data.end[i],
          label: label,
          color: color
        });
      });

      function key (d) {
        return d.data.label;
      }

      options.pieWidth = 300;
      options.pieHeight = 300;

      slices = svg.append('g').attr('class', 'slices');
      labels = svg.append('g').attr('class', 'labels');
      lines = svg.append('g').attr('class', 'lines');
      text = svg.append('g').attr('class', 'text');

      svg.selectAll('g').
        attr('transform', function () {
          return 'translate(' + options.width / 2 + ',' + options.height / 2 + ')';
        });

      // set the thickness of the inner and outer radii
      min = Math.min(options.pieWidth, options.pieHeight);
      radius = min / 2;

      pie = d3.layout.pie().
        value(function (d) {
          return d.value;
        }).
        sort(null);

      innerArc = d3.svg.arc().
        outerRadius(radius * 0.8).
        innerRadius(radius * 0.4);

      outerArc = d3.svg.arc().
        innerRadius(radius * 0.9).
        outerRadius(radius * 0.9);

      percentage = text.append('text').
        attr('text-anchor', 'middle').
        attr('alignment-baseline', 'central').
        attr({
          'style': 'font-size: ' + options.pieWidth / 6 + 'px',
          'fill': getColor('amount')
        });

      function drawChart (data, duration) {
        var slice = slices.
          selectAll('path.slice').
          data(pie(data), key);

        if (!duration) {
          duration = 0;
        }

        slice.enter().
          insert('path').
          style('fill', function (d) {
            return d.data.color;
          }).
          attr('class', 'slice');

        slice.
          transition().duration(duration).
            attrTween('d', function (d) {
              var interpolate;
              this._current = this._current || d;
              interpolate = d3.interpolate(this._current, d);
              return function (t) {
                var v = interpolate(t);
                percentage.text(Math.round(v.value) + '%');
                return innerArc(v);
              };
            });
      }

      function midAngle (d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
      }

      function drawLines (data) {
        var polyline = lines
          .selectAll('polyline')
          .data(pie(data), key);

        polyline.enter().
          append('polyline').
          style({
            'opacity': '0.3',
            'stroke': getColor('lines'),
            'stroke-width': '2px',
            'fill': 'none'
          }).
          attr('points', function (d) {
            var pos = outerArc.centroid(d);
            pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
            return [innerArc.centroid(d), outerArc.centroid(d), pos];
          });

        polyline.exit().
          remove();
      }

      function drawLabels (data) {
        var labelsD = labels.selectAll('text')
          .data(pie(data), key);

        labelsD.enter().
          append('text').
          attr('dy', '.35em').
          style('fill', getColor('labels')).
          text(function (d) {
            return d.data.label;
          }).
          attr('transform', function (d) {
            var pos = outerArc.centroid(d);
            pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
          }).
          style('text-anchor', function (d) {
            return midAngle(d) < Math.PI ? 'start' : 'end';
          });
      }

      drawChart(d3Data.start);

      setTimeout(function () {
        drawChart(d3Data.end, options.duration);

        if (options.labels) {
          setTimeout(function () {
            drawLines(d3Data.end);
            drawLabels(d3Data.end);
          }, options.duration);
        }
      }, options.delay);

    }

    return {
      restrict: 'E',
      scope: {
        render: '=',
        data: '='
      },
      link: function (scope, element, attrs) {
        $rootScope[attrs.render] = function (data) {
          scope.data = data;
          render(scope, element, attrs);
        };
      }
    };

}]);

'use strict';

angular.module('picardy.graphs.common', [])
  .factory('common', function () {

    return {

      readOptions: function (scope, element, attrs) {

        function _getValue (attrValue, defaultValue) {
          return attrValue === undefined ? defaultValue : attrValue;
        }

        return {
          delay: _getValue(attrs.delay, 500),
          duration: _getValue(attrs.duration, 1000)
        };
      },

      initSvg: function (el, width, height) {

        return d3.select(el)
          .append('svg')
          .attr('viewBox', [0, 0, width, height].join(' '));
      }
    };
  });
