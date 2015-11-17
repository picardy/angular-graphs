'use strict';

angular.module('picardy.graphs.common', [])
  .factory('common', ['$window', function ($window) {

    function d3_time_range(floor, step, number) {
      return function(t0, t1, dt) {
        var time = floor(t0), times = [];
        if (time < t0) step(time);
        if (dt > 1) {
          while (time < t1) {
            var date = new Date(+time);
            if (!(number(date) % dt)) times.push(date);
            step(time);
          }
        } else {
          while (time < t1) times.push(new Date(+time)), step(time);
        }
        return times;
      };
    }

    d3.time.daysTotal = d3_time_range(d3.time.day, function(date) {
      date.setDate(date.getDate() + 1);
    }, function(date) {
      return ~~(date/86400000);
    });

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
        el.innerHTML = '';
        return d3.select(el).
          append('svg').
          attr({
            width: width,
            height: height
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
      },

      onWindowResize: function (callback) {
        var win = angular.element($window);
        win.bind('resize', callback);
      }
    };

    return common;
  }]);
