'use strict';

angular.module('picardy.graphs.bar', ['picardy.graphs.common'])
  .directive('d3GraphBar', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var options, options, getColor, svg, margin, width, height, x, y, labels, axes, bars, info;

      if (!scope.data) {
        return;
      }

      options = angular.copy(scope.data);
      getColor = common.colors(options.colors);

      common.defaults(options, {
        height: 300,
        delay: 500,
        duration: 1000,
        infoFormat: '{y} · {x}'
      });
      if (options.width === undefined) {
        options.width = options.height * 2;
      }

      svg = common.initSvg(element[0], options.width, options.height);

      labels = common.newLayer(svg, 'labels');
      bars = common.newLayer(svg, 'bars');
      axes = common.newLayer(svg, 'axes');
      info = common.newLayer(svg, 'info');

      margin = {top: 20, right: 20, bottom: 30, left: 20};
      width = options.width - margin.left - margin.right;
      height = options.height - margin.top - margin.bottom;

      x = d3.scale.ordinal().rangeRoundBands([0, width], 0.2);
      y = d3.scale.linear().range([height, 0]);

      x.domain(options.data.map(function (d) {
        return d.x;
      }));
      y.domain([0, d3.max(options.data, function (d) {
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

        /* Y AXIS */
        var yNode = axes.
          append('g').
            call(yAxis).
            attr('class', 'y axis').
            selectAll('text').
              style('fill', getColor('axes'));

        /* X AXIS */
        xAxis.
          tickFormat('');

        axes.
          append('g').
            attr('class', 'x axis').
            call(xAxis).
            selectAll('text').
              style('fill', getColor('axes')).
              attr('transform', common.translate(0, 10));

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
            attr('transform', 'rotate(-90) ' + common.translate(-10, 0)).
            style({
              'text-anchor': 'end',
              'fill': getColor('labels')
            }).
            text(yLabel);
      }

      function getFormattedInfo (input) {
        return options.infoFormat.
          replace('{x}', input.x).
          replace('{y}', input.y);
      }

      function toggleBarFocus (bar, isFocused) {
        d3.select(bar).
          attr('fill', isFocused ? getColor('focusedBar') : getColor('bars'));
      }

      function toggleBarInfo (d, isShown) {
        if (isShown) {
          info.
            append('text').
              text(getFormattedInfo(d)).
              attr({
                'text-anchor': 'middle',
                'alignment-baseline': 'central',
                'transform': function () {
                  var boxWidthHalf = this.getBBox().width / 2;
                  var xPos = margin.left + x(d.x) + x.rangeBand() / 2;
                  var xMax = width - boxWidthHalf;
                  var xMin = margin.left + boxWidthHalf;

                  xPos = Math.max(xMin, Math.min(xMax, xPos));

                  return common.translate(xPos, height + 40);
                }
              });
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

      function drawBars () {
        bars
          .selectAll('.bar')
          .data(options.data)
          .enter()
            .append('rect')
            .attr({
              'class': 'bar',
              'width': x.rangeBand(),
              'height': 0,
              'fill': getColor('bars')
            })
            .on({
              'mouseover': onMouseoverBar,
              'mouseout': onMouseoutBar
            });
      }

      function resolveXAxis (delay, duration) {
        svg.selectAll('.y.axis')
          .attr('transform', function () {
            var labelWidth = this.getBBox().width;
            margin.left += labelWidth;
            width += labelWidth;
            return common.translate(margin.left, 1);
          });

        svg.selectAll('.x.axis')
          .attr('transform', function () {
            return common.translate(margin.left, height + 1);
          });

        svg.selectAll('.bar')
            .attr('transform', function (d) {
              return common.translate(margin.left + x(d.x), height + 1);
            }).
            transition().delay(delay).duration(duration).
              attr('transform', function (d) {
                return common.translate(margin.left + x(d.x), y(d.y) + 1);
              }).
              attr('height', function (d) {
                return height - y(d.y);
              });

        svg.
          attr({
            width: function () {
              return width + margin.left + margin.right;
            },
            height: function () {
              return height + margin.top + margin.bottom;
            }
          });
      }

      drawAxes();
      drawLabels(options.labels.y);
      drawBars();
      resolveXAxis(options.delay, options.duration);
    }

    return common.define($rootScope, render);
  }]);
