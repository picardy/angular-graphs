'use strict';

angular.module('picardy.graphs.common', [])
  .factory('common', function () {

    return {

      readOptions: function (scope, element, attrs) {

        function _getValue (attrValue, defaultValue) {
          return attrValue === undefined ? defaultValue : attrValue;
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
