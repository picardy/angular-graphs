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
