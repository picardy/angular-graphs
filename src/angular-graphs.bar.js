'use strict';

angular.module('picardy.graphs.bar', ['picardy.graphs.common'])
  .directive('d3GraphBar', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var _data, options, getColor, svg, margin, width, height, x, y, labels, axes, bars, info;

      if (!scope.data) {
        return;
      }

      _data = angular.copy(scope.data);
      getColor = common.colors(_data.colors);

      options = common.defaults(_data, {
        height: 300,
        delay: 500,
        duration: 1000
      });
      options.width = scope.width === undefined ? options.height * 2 : scope.width;

      svg = common.initSvg(element[0], options.width, options.height);

      labels = common.newLayer(svg, 'labels');
      bars = common.newLayer(svg, 'bars');
      axes = common.newLayer(svg, 'axes');
      info = common.newLayer(svg, 'info');

      margin = {top: 20, right: 20, bottom: 30, left: 125};
      width = options.width - margin.left - margin.right;
      height = options.height - margin.top - margin.bottom;

      x = d3.scale.ordinal().rangeRoundBands([0, width], 0.2);
      y = d3.scale.linear().range([height, 0]);

      x.domain(_data.data.map(function (d) {
        return d.x;
      }));
      y.domain([0, d3.max(_data.data, function (d) {
        return d.y;
      })]);

      function drawAxes () {
        var xAxis, yAxis;

        xAxis = d3.svg.axis()
          .scale(x)
          .orient('bottom');
        yAxis = d3.svg.axis()
          .scale(y)
          .orient('left');

        /* X AXIS */
        xAxis.
          tickFormat('');

        axes.
          append('g').
            attr({
              'class': 'x axis',
              'transform': common.translate(margin.left, height + 1)
            }).
            call(xAxis).
            selectAll('text').
              style('fill', getColor('axes')).
              attr('transform', common.translate(0, 10));

        /* Y AXIS */
        axes.
          append('g').
            attr({
              'class': 'y axis',
              'transform': common.translate(margin.left, 1)
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
            attr('transform', 'rotate(-90) ' + common.translate(-10, 20)).
            style({
              'text-anchor': 'end',
              'fill': getColor('labels')
            }).
            text(yLabel);
      }

      function toggleBarFocus (bar, isFocused) {
        d3.select(bar).
          attr('fill', isFocused ? getColor('focusedBar') : getColor('bars'));
      }

      function toggleBarInfo (d, isShown) {
        if (isShown) {
          info.
            append('text').
              attr({
                'transform': common.translate(margin.left + x(d.x) + x.rangeBand() / 2, height + 40),
                'text-anchor': 'middle',
                'alignment-baseline': 'central'
              })
              .text(d.x + ' ' + d.y);
        } else {
          info.
            selectAll('text')
              .remove();
        }
      }

      function onMouseoverBar (d) {
        toggleBarFocus(this, true);
        toggleBarInfo(d, true);
      }

      function onMouseoutBar (d) {
        toggleBarFocus(this, false);
        toggleBarInfo(d, false);
      }

      function drawBars (delay, duration) {
        bars
          .selectAll('.bar')
          .data(_data.data)
          .enter()
            .append('rect')
            .attr({
              'class': 'bar',
              'width': x.rangeBand(),
              'height': 0,
              'transform': function (d) {
                return common.translate(margin.left + x(d.x), height + 1);
              },
              'fill': getColor('bars')
            })
            .on({
              'mouseover': onMouseoverBar,
              'mouseout': onMouseoutBar
            }).
            transition().delay(delay).duration(duration).
              attr('transform', function (d) {
                return common.translate(margin.left + x(d.x), y(d.y) + 1);
              }).
              attr('height', function (d) {
                return height - y(d.y);
              });
      }

      svg.
        attr({
          'width': width + margin.left + margin.right,
          'height': height + margin.top + margin.bottom
        });

      drawAxes();
      drawLabels(_data.labels.y);
      drawBars(options.delay, options.duration);
    }

    return common.define($rootScope, render);
  }]);
