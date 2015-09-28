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

      margin = {
        info: 50
      };

      function drawLabels (yLabel, done) {
        labels.
          append('text').
            text(yLabel).
            attr('transform', function () {
              margin.label = this.getBBox().height;
              return 'rotate(-90) ' + common.translate(-10, margin.label);
            }).
            style({
              'text-anchor': 'end',
              'fill': getColor('labels'),
              'done': done
            });
      }

      function drawYAxis (done) {
        var yAxis;

        y = d3.scale.linear().range([options.height - margin.info, 0]);
        y.domain([0, d3.max(options.data, function (d) {
          return d.y;
        })]);

        yAxis = d3.svg.axis()
          .scale(y)
          .orient('left');

        axes.
          append('g').
            call(yAxis).
            attr({
              'class': 'y axis',
              'transform': function () {
                margin.yAxis = this.getBBox().width;
                return common.translate(margin.label + margin.yAxis + 20, 1);
              },
              'done': done
            }).
            selectAll('text').
              style('fill', getColor('axes'));
      }

      function drawXAxis () {
        var xAxis;

        x = d3.scale.ordinal().rangeRoundBands([0, options.width - margin.label - margin.yAxis - 20 - 1], 0.2);

        x.domain(options.data.map(function (d) {
          return d.x;
        }));

        xAxis = d3.svg.axis()
          .scale(x)
          .orient('bottom');

        xAxis.
          tickFormat('');

        axes.
          append('g').
            call(xAxis).
            attr({
              'class': 'x axis',
              'transform': function () {
                return common.translate(margin.label + margin.yAxis + 20, options.height - margin.info + 1);
              }
            }).
            selectAll('text').
              style('fill', getColor('axes')).
              attr('transform', common.translate(0, 10));
      }

      function drawAxes (done) {
        drawYAxis(function () {
          drawXAxis();

          axes.selectAll('.axis path, .axis line').
            style({
              'fill': 'none',
              'stroke': getColor('axes'),
              'shape-rendering': 'crispEdges'
            });

          done();
        });
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
                  var xPos = margin.label + margin.yAxis + 20 + x(d.x) + x.rangeBand() / 2;
                  var xMax = options.width - boxWidthHalf;
                  var xMin = margin.label + margin.yAxis + 20 + boxWidthHalf;

                  xPos = Math.max(xMin, Math.min(xMax, xPos));

                  return common.translate(xPos, options.height - this.getBBox().height);
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
              'fill': getColor('bars'),
              'width': x.rangeBand(),
              'height': 0,
              'transform': function (d) {
                return common.translate(margin.label + margin.yAxis + 20 + x(d.x), options.height - margin.info + 1);
              }
            })
            .on({
              'mouseover': onMouseoverBar,
              'mouseout': onMouseoutBar
            }).
            transition().delay(options.delay).duration(options.duration).
              attr('transform', function (d) {
                return common.translate(margin.label + margin.yAxis + 20 + x(d.x), y(d.y) + 1);
              }).
              attr('height', function (d) {
                return options.height - margin.info - y(d.y);
              });
      }

      svg.
        attr({
          width: options.width,
          height: options.height
        });

      drawLabels(options.labels.y, function () {
        drawAxes(function () {
          drawBars();
        });
      });
    }

    return common.define($rootScope, render);
  }]);
