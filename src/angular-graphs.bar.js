'use strict';

angular.module('picardy.graphs.bar', ['picardy.graphs.common'])
  .directive('d3GraphBar', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var options, options, getColor, svg, margin, x, y, labels, axes, bars, info;

      if (!scope.data) {
        return;
      }

      function isVertical () {
        return options.orientation === 'vertical';
      }

      options = angular.copy(scope.data);
      getColor = common.colors(options.colors);

      common.defaults(options, {
        delay: 500,
        duration: 1000,
        infoFormat: '{y} · {x}',
        orientation: 'vertical'
      });

      if (isVertical()) {
        common.defaults(options, {
          height: 300
        });
        if (options.width === undefined) {
          options.width = options.height * 2;
        }
      } else {
        common.defaults(options, {
          width: 300
        });
        if (options.height === undefined) {
          options.height = options.width * 2;
        }
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
              if (isVertical()) {
                return 'rotate(-90) ' + common.translate(-10, margin.label);
              }
              return common.translate(options.width, margin.info + margin.label);
            }).
            style({
              'text-anchor': 'end',
              'fill': getColor('labels'),
              'done': done
            });
      }

      function drawYAxis (done) {
        var axisLength = options.height,
            yAxis;

        if (isVertical()) {
          axisLength -= margin.info;
          y = d3.scale.linear().range([axisLength, 0]);
          y.domain([0, d3.max(options.data, function (d) {
            return d.y;
          })]);
        } else {
          axisLength -= margin.info + margin.label + 21;
          y = d3.scale.ordinal().rangeRoundBands([0, axisLength], 0.2);
          y.domain(options.data.map(function (d) {
            return d.x;
          }));
        }

        yAxis = d3.svg.axis()
          .scale(y)
          .orient('left');

        if (!isVertical()) {
          yAxis.
            tickFormat('');
        }

        axes.
          append('g').
            call(yAxis).
            attr({
              'class': 'y axis',
              'transform': function () {
                var xPos = 0;
                var yPos = 1;
                if (isVertical()) {
                  margin.yAxis = this.getBBox().width;
                  xPos = margin.label + margin.yAxis + 20;
                } else {
                  xPos += 20;
                  yPos += margin.info + margin.label + 20;
                }
                return common.translate(xPos, yPos);
              },
              'done': done
            }).
            selectAll('text').
              style('fill', getColor('axes'));
      }

      function drawXAxis () {
        var axisLength = options.width - 21,
            xAxis;

        if (isVertical()) {
          axisLength -= margin.label + margin.yAxis;
          x = d3.scale.ordinal().rangeRoundBands([0, axisLength], 0.2);
          x.domain(options.data.map(function (d) {
            return d.x;
          }));
        } else {
          x = d3.scale.linear().range([axisLength, 0]);
          x.domain([0, d3.max(options.data, function (d) {
            return d.y;
          })]);
        }

        xAxis = d3.svg.axis()
          .scale(x)
          .orient(isVertical() ? 'bottom' : 'top');

        xAxis.
          tickFormat('');

        axes.
          append('g').
            call(xAxis).
            attr({
              'class': 'x axis',
              'transform': function () {
                var xPos = 20,
                    yPos = 1;
                return isVertical()
                  ? common.translate(xPos + margin.label + margin.yAxis, yPos + options.height - margin.info)
                  : common.translate(xPos, yPos + margin.info + margin.label + 20);
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
                'text-anchor': isVertical() ? 'middle' : 'left',
                'alignment-baseline': 'central',
                'transform': function () {
                  var xPos, yPos;
                  if (isVertical()) {
                    var boxWidthHalf = this.getBBox().width / 2;
                    yPos = options.height - this.getBBox().height;
                    xPos = margin.label + margin.yAxis + 20 + x(d.x) + x.rangeBand() / 2;
                    var xMax = options.width - boxWidthHalf;
                    var xMin = margin.label + margin.yAxis + 20 + boxWidthHalf;

                    xPos = Math.max(xMin, Math.min(xMax, xPos));
                  } else {
                    xPos = 20;
                    yPos = margin.info / 2;
                  }

                  return common.translate(xPos, yPos);
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
        var attrTransitions = {
          transform: function (d) {
            return isVertical()
              ? common.translate(margin.label + margin.yAxis + 20 + x(d.x), y(d.y) + 1)
              : common.translate(20, margin.info + margin.label + y(d.x) + 21);
          }
        };

        if (isVertical()) {
          attrTransitions.height = function (d) {
            return options.height - margin.info - y(d.y);
          };
        } else {
          attrTransitions.width = function (d) {
            return options.width - x(d.y) - 21;
          };
        }

        bars
          .selectAll('.bar')
          .data(options.data)
          .enter()
            .append('rect')
            .attr({
              'class': 'bar',
              'fill': getColor('bars'),
              'width': isVertical() ? x.rangeBand() : 0,
              'height': isVertical() ? 0 : y.rangeBand(),
              'transform': function (d) {
                return isVertical()
                  ? common.translate(margin.label + margin.yAxis + 20 + x(d.x), options.height - margin.info + 1)
                  : common.translate(20, margin.info + margin.label + y(d.x) + 21);
              }
            })
            .on({
              'mouseover': onMouseoverBar,
              'mouseout': onMouseoutBar
            }).
            transition().delay(options.delay).duration(options.duration).
              attr(attrTransitions);
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
