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
