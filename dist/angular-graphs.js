'use strict';

angular.module('picardy.graphs.line', ['picardy.graphs.common'])
  .directive('d3GraphLine', ['common', function (common) {

    return {
      restrict: 'E',
      scope: {
        type: '@',
        height: '@',
        width: '@',
        radius: '@'
      },
      link: function (scope, element, attrs) {

        var options = common.readOptions(scope, element, attrs);
        var svg = common.initSvg(element[0], options.width, options.height);
        var parseDate = d3.time.format('%d-%b-%y').parse;
        var dataset, margin, width, height, x, y, xAxis, yAxis, line, path, totalLength;

        dataset = [
          {date: '13-Oct-13', count: 10},
          {date: '17-Oct-13', count: 13},
          {date: '18-Oct-13', count: 18},
          {date: '18-Oct-13', count: 35},
          {date: '21-Oct-13', count: 10},
          {date: '26-Oct-13', count: 13},
          {date: '27-Oct-13', count: 18}
        ];

        margin = {top: 20, right: 20, bottom: 30, left: 50};

        width = options.width - margin.left - margin.right;
        height = options.height - margin.top - margin.bottom;

        x = d3.time.scale().range([0, width - 20]);
        y = d3.scale.linear().range([height, 20]);

        xAxis = d3.svg.axis().
          scale(x).
          ticks(d3.time.days, 3).
          tickFormat(d3.time.format('%a %d')).
          tickSize(0).
          orient('bottom');

        yAxis = d3.svg.axis().
          scale(y).
          orient('left');

        line = d3.svg.line().
          interpolate('linear').
          x(function (d) {
            return x(d.date);
          }).
          y(function (d) {
            return y(d.count);
          });

        dataset.forEach(function (d) {
          d.date = parseDate(d.date);
          d.count = +d.count;
        });

        x.domain(d3.extent(dataset, function (d) {
          return d.date;
        }));
        y.domain([0, d3.max(dataset, function (d) {
          return d.count;
        })]);

        svg.
          attr('width', width + margin.left + margin.right).
          attr('heigh', height + margin.top + margin.bottom).
        append('g').
          attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        svg.append('g').
          attr('class', 'x axis').
          attr('transform', 'translate(' + margin.left + ',' + height + ')').
          call(xAxis).
        selectAll('text').
          attr('transform', 'translate(0,10)');

        svg.append('g').
          attr('class', 'y axis').
          attr('transform', 'translate(' + margin.left + ',0)').
          call(yAxis).
        append('text').
          attr('transform', 'rotate(-90) translate(0, 20)').
          style('text-anchor', 'end').
          text('Price ($)');

        path = svg.append('path').
          datum(dataset).
          attr('transform', 'translate(' + margin.left + ',0)').
          attr('class', 'line').
          attr('d', line);

        totalLength = path.node().getTotalLength();

        path.
          attr('stroke-dasharray', totalLength + ' ' + totalLength).
          attr('stroke-dashoffset', totalLength).
          transition().
            duration(1000).
            delay(options.delay).
            ease('cubic').
            attr('stroke-dashoffset', 0);

        svg.selectAll('.axis path, .axis line').
          style('fill', 'none').
          style('stroke', '#000000').
          style('shape-rendering', 'crispEdges');

        svg.selectAll('.line').
          style('fill', 'none').
          style('stroke', 'red').
          style('stroke-width', '1.5px');

      }
    };
  }]);

'use strict';

angular.module('picardy.graphs.pie', ['picardy.graphs.common'])
  .directive('d3GraphPie', ['common', function (common) {

    return {
      restrict: 'E',
      scope: {
        data: '=',
        labels: '=',
        height: '@',
        width: '@',
        radius: '@'
      },
      link: function (scope, element, attrs) {

        var options = common.readOptions(scope, element, attrs);
        var svg = common.initSvg(element[0], options.width, options.height);
        var colors = d3.scale.category10();
        var slices, labels, lines, text, min, radius, pie, innerArc, outerArc, percentage;

        function key (d) {
          return d.data.label;
        }

        options.pieWidth = attrs.pieWidth;
        options.pieHeight = attrs.pieHeight;

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
          attr('style', 'font-size: ' + options.pieWidth / 6 + 'px');

        function drawChart (data, duration) {
          var slice = slices.
            selectAll('path.slice').
            data(pie(data), key);

          if (!duration) {
            duration = 0;
          }

          slice.enter().
            insert('path').
            style('fill', function (d, i) {
              return i === 0 ? colors(0) : colors(1);
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
              'stroke': 'black',
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

        drawChart(scope.data.start);

        setTimeout(function () {
          scope.data.end[0].value = 20;
          scope.data.end[1].value = 80;
          drawChart(scope.data.end, options.duration);

          if (scope.labels) {
            setTimeout(function () {
              drawLines(scope.data.end);
              drawLabels(scope.data.end);
            }, options.duration);
          }
        }, options.delay);

      }
    };

}]);

'use strict';

angular.module('picardy.graphs.common', [])
  .factory('common', function () {

    return {

      readOptions: function (scope, element, attrs) {

        function _getValue (attrValue, defaultValue) {
          return attrValue === undefined ? attrValue : defaultValue;
        }

        return {
          width: _getValue(attrs.width, 600),
          height: _getValue(attrs.height, 300),
          delay: _getValue(attrs.delay, 500),
          duration: _getValue(attrs.duration, 1000)
        };
      },

      initSvg: function (el, width, height) {

        return d3.select(el)
          .append('svg')
          .attr('width', width)
          .attr('height', height);
      }
    };
  });
