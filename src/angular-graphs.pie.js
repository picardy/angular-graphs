angular.module('picardy.graphs.pie', ['picardy.graphs.common'])
  .directive('d3GraphPie', ['common', function (common) {

    return {
      restrict: 'E',
      scope: {
        type: '@',
        height: '@',
        width: '@',
        radius: '@'
      },
      link: function (scope, element, attrs) {

        var options = common.readOptions(scope, element, attrs);
        var svg = common.initSvg(element[0], options.width, options.height);
        var colors = d3.scale.ordinal().range(['#A60F2B', '#648C85', '#B3F2C9', '#528C18', '#C3F25C']);

        options.pieWidth = attrs.pieWidth;
        options.pieHeight = attrs.pieHeight;

        var slices = svg.append("g").attr("class", "slices");
        var labels = svg.append("g").attr("class", "labels");
        var lines = svg.append("g").attr("class", "lines");
        var text = svg.append("g").attr("class", "text");

        svg.selectAll('g')
          .attr('transform', function(){
            return 'translate(' + options.width / 2 + ',' + options.height / 2 + ')';
          });

        var key = function(d){ return d.data.label; };

        var data = [
          {label: 'Incomplete', value: 100},
          {label: 'Complete', value: 0}
        ];

        // set the thickness of the inner and outer radii
        var min = Math.min(options.pieWidth, options.pieHeight);
        var radius = min / 2;

        var pie = d3.layout.pie().value(function(d){ return d.value; }).sort(null);

        var innerArc = d3.svg.arc()
          .outerRadius(radius * 0.8)
          .innerRadius(radius * 0.4);

        var outerArc = d3.svg.arc()
          .innerRadius(radius * 0.9)
          .outerRadius(radius * 0.9);

        var percentage = text.append('text')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .attr('style', 'font-size: ' + options.pieWidth / 6 + 'px');

        function drawChart (data, duration) {
          var slice = slices.selectAll("path.slice")
            .data(pie(data), key);

          duration || (duration = 0);

          slice.enter()
            .insert('path')
            .style('fill', function (d, i) {
              return i === 0 ? colors.empty : colors.fill;
            })
            .attr('class', 'slice');

          slice
            .transition().duration(duration)
              .attrTween('d', function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
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

        function drawLines () {

          var polyline = lines
            .selectAll('polyline')
            .data(pie(data), key);

          polyline.enter()
            .append('polyline')
            .attr('points', function (d) {
              var pos = outerArc.centroid(d);
              pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
              return [innerArc.centroid(d), outerArc.centroid(d), pos];
            });

          polyline.exit()
            .remove();
        }

        function drawLabels (data) {
          var labelsD = labels.selectAll("text")
            .data(pie(data), key);

          labelsD.enter()
            .append('text')
            .attr('dy', '.35em')
            .text(function (d) {
              return d.data.label;
            })
            .attr('transform', function (d) {
              var pos = outerArc.centroid(d);
              pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
              return 'translate(' + pos + ')';
            })
            .style('text-anchor', function (d) {
              return midAngle(d) < Math.PI ? 'start' : 'end';
            });
        }

        drawChart(data);

        setTimeout(function () {
          data[0].value = 20;
          data[1].value = 80;
          drawChart(data, options.duration);

          setTimeout(function () {
            drawLines(data);
            drawLabels(data);
          }, options.duration);
        }, options.delay);

      }
    };

}]);
