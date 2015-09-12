'use strict';

angular.module('picardy.graphs.pie', ['picardy.graphs.common'])
  .directive('d3GraphPie', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var _data, d3Data, options, getColor, svg, slices, labels, lines, text, min, radius, pie, innerArc, outerArc, percentage;

      if (!scope.data) {
        return;
      }

      _data = angular.copy(scope.data);
      getColor = common.colors(_data.colors);
      d3Data = {start: [], end: []};

      options = common.defaults(_data, {
        height: 300,
        delay: 500,
        duration: 1000
      });
      options.labels = _data.labels && _data.labels.length;
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

      slices = common.newLayer(svg, 'slices');
      lines = common.newLayer(svg, 'lines');
      labels = common.newLayer(svg, 'labels');
      text = common.newLayer(svg, 'text');

      svg.selectAll('g').
        attr('transform', function () {
          return common.translate(options.width / 2, options.height / 2);
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
        attr({
          'text-anchor': 'middle',
          'alignment-baseline': 'central',
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
          text(function (d) {
            return d.data.label;
          }).
          attr({
            'dy': '.35em',
            'transform': function (d) {
              var pos = outerArc.centroid(d);
              pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
              return common.translate(pos);
            }
          }).
          style({
            'fill': getColor('labels'),
            'text-anchor': function (d) {
              return midAngle(d) < Math.PI ? 'start' : 'end';
            }
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

    return common.define($rootScope, render);
}]);
