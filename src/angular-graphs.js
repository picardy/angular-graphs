(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular'], factory);
    } else {
        root.amdWeb = factory(root.angular);
    }
}(this, function (angular) {

  angular.module('picardy.graphs', [])
    .directive('d3Graph', function () {
      return {
        restrict: 'E',
        replace: true,
        link: function (scope, element, attrs) {

        }
      };
    });

}));
