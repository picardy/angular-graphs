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

      if (element[0].children.length > 0) {
          element[0].children[0].remove();
      }

      svg = common.initSvg(element[0], options.width, options.height);

      labels = common.newLayer(svg, 'labels');
      bars = common.newLayer(svg, 'bars');
      axes = common.newLayer(svg, 'axes');
      info = common.newLayer(svg, 'info');

      margin = {
        top: 10,
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

      function getYRange () {
        var range;

        if (options.max && options.max.y) {
          range = [0, options.max.y];
        } else {
          range = [0, d3.max(options.data, function (d) {
            return d.y;
          })];
        }

        return range;
      }

      function getXRange () {
        return options.data.map(function (d) {
          return d.x;
        });
      }

      function drawYAxis (done) {
        var axisLength = options.height,
            yAxis, range;

        if (isVertical()) {
          axisLength -= margin.info;
          axisLength -= margin.top;
          y = d3.scale.linear().range([axisLength, 0]);
          range = getYRange();
          y.domain(range);
        } else {
          axisLength -= margin.info + margin.label + 21;
          y = d3.scale.ordinal().rangeRoundBands([0, axisLength], 0.2);
          range = getXRange();
          y.domain(range);
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
                  yPos += margin.top;
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
            xAxis, range;

        if (isVertical()) {
          axisLength -= margin.label + margin.yAxis;
          x = d3.scale.ordinal().rangeRoundBands([0, axisLength], 0.2);
          range = getXRange();
          x.domain(range);
        } else {
          x = d3.scale.linear().range([axisLength, 0]);
          range = getYRange();
          x.domain(range);
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
                  var xPos, yPos, boxWidthHalf, xMax, xMin;
                  if (isVertical()) {
                    boxWidthHalf = this.getBBox().width / 2;
                    yPos = options.height - this.getBBox().height;
                    xPos = margin.label + margin.yAxis + 20 + x(d.x) + x.rangeBand() / 2;
                    xMax = options.width - boxWidthHalf;
                    xMin = margin.label + margin.yAxis + 20 + boxWidthHalf;

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
              ? common.translate(margin.label + margin.yAxis + 20 + x(d.x), margin.top + y(d.y) + 1)
              : common.translate(20, margin.info + margin.label + y(d.x) + 21);
          }
        };

        if (isVertical()) {
          attrTransitions.height = function (d) {
            return options.height - margin.top - margin.info - y(d.y);
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

      common.defaults(options, {
        height: 300,
        delay: 500,
        duration: 1000
      });
      if (options.width === undefined) {
        options.width = options.height * 2;
      }

      svg = common.initSvg(element[0], options.width, options.height);

      labels = common.newLayer(svg, 'labels');
      lines = common.newLayer(svg, 'lines');
      axes = common.newLayer(svg, 'axes');

      margin = {top: 20, right: 20, bottom: 30, left: 50};
      width = options.width - margin.left - margin.right;
      height = options.height - margin.top - margin.bottom;

      angular.forEach(options.data, function (d) {
        if (d.x > 0) {
          d.x = new Date(d.x);
        }
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
      drawLabels(options.labels.y);
      drawLines(options.delay, options.duration);

    }

    return common.define($rootScope, render);
  }]);

'use strict';

angular.module('picardy.graphs.pie', ['picardy.graphs.common'])
  .directive('d3GraphPie', ['common', '$rootScope', function (common, $rootScope) {

    function render (scope, element) {

      var options, d3Data, options, getColor, svg, slices, labels, lines, text, min, radius, pie, innerArc, outerArc, percentage;

      if (!scope.data) {
        return;
      }

      options = angular.copy(scope.data);
      getColor = common.colors(options.colors);
      d3Data = {start: [], end: []};

      common.defaults(options, {
        height: 300,
        delay: 500,
        duration: 1000
      });
      if (options.width === undefined) {
        options.width = options.height + (options.labels ? 200 : 0);
      }

      svg = common.initSvg(element[0], options.width, options.height);

      angular.forEach(options.start, function (val, i) {
        var label = options.labels ? options.labels[i] : Math.random(),
            color = getColor('slices', i);

        d3Data.start.push({
          value: options.start[i],
          label: label,
          color: color
        });

        d3Data.end.push({
          value: options.end[i],
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

'use strict';

angular.module('picardy.graphs.common', [])
  .factory('common', function () {

    var common = {

      define: function ($rootScope, render) {
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
      },

      initSvg: function (el, width, height) {
        return d3.select(el)
          .append('svg')
          .attr({
            'viewBox': [0, 0, width, height].join(' '),
            'preserveAspectRatio': 'xMinYMin meet'
          });
      },

      colors: function (colors) {
        return function getColor (type, i) {
          var color;
          if (colors) {
            color = colors[type];
            if (color) {
              if (i === undefined) {
                return color;
              } else if (color.length > i) {
                return color[i];
              } else {
                return d3.scale.category10().range()[i];
              }
            }
          }
          return 'black';
        };
      },

      newLayer: function (svg, name) {
        return svg.append('g').attr('class', name);
      },

      defaults: function (obj, defaults) {
        var key;
        for (key in defaults) {
          if (obj[key] === undefined && defaults.hasOwnProperty(key)) {
            obj[key] = defaults[key];
          }
        }
        return obj;
      },

      translate: function (x, y) {
        return 'translate(' + x + (y === undefined ? '' : ',' + y) + ')';
      }
    };

    return common;
  });
