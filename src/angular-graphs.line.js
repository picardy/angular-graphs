angular.module('picardy.graphs.line', ['picardy.graphs.common'])
  .directive('d3GraphLine', ['common', function (common) {

    return {
      restrict: 'E',
      scope: {
        type: '@',
        height: '@',
        width: '@',
        radius: '@'
      },
      link: function (scope, element, attrs) {

        var options = common.readOptions(scope, element, attrs),
            parseDate,
            dataset,
            margin,
            x,
            y,
            xAxis,
            yAxis,
            line,
            path,
            totalLength;

        var svg = common.initSvg(element[0], options.width, options.height)

        parseDate = d3.time.format('%d-%b-%y').parse;

        dataset = [
          { date: '13-Oct-13', count: 10 },
          { date: '17-Oct-13', count: 13 },
          { date: '18-Oct-13', count: 18 },
          { date: '18-Oct-13', count: 35 },
          { date: '21-Oct-13', count: 10 },
          { date: '26-Oct-13', count: 13 },
          { date: '27-Oct-13', count: 18 }
        ];

        margin = {top: 20, right: 20, bottom: 30, left: 50};
        var width = options.width - margin.left - margin.right;
        var height = options.height - margin.top - margin.bottom;

        x = d3.time.scale().
          range([0, width - 20]);

        y = d3.scale.linear().
          range([height, 20]);

        xAxis = d3.svg.axis().
          scale(x).
          ticks(d3.time.days, 3).
          tickFormat(d3.time.format('%a %d')).
          tickSize(0).
          orient('bottom');

        yAxis = d3.svg.axis().
          scale(y).
          orient('left');

        line = d3.svg.line().
          interpolate('linear').
          x(function (d) {
            return x(d.date); }).
          y(function (d) {
            return y(d.count); });

        dataset.forEach(function (d) {
          d.date = parseDate(d.date);
          d.count = +d.count;
        });

        x.domain(d3.extent(dataset, function (d) {
          return d.date; }));
        y.domain([0, d3.max(dataset, function (d) {
          return d.count; })]);

        svg.
          attr('width', width + margin.left + margin.right).
          attr('heigh', height + margin.top + margin.bottom).
        append('g').
          attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        svg.append('g').
          attr('class', 'x axis').
          attr('transform', 'translate(' + margin.left + ',' + height + ')').
          call(xAxis).
        selectAll('text').
          attr('transform', 'translate(0,10)');

        svg.append('g').
          attr('class', 'y axis').
          attr('transform', 'translate(' + margin.left + ',0)').
          call(yAxis).
        append('text').
          attr('transform', 'rotate(-90) translate(0, 20)').
          style('text-anchor', 'end').
          text('Price ($)');

        path = svg.append('path').
          datum(dataset).
          attr('transform', 'translate(' + margin.left + ',0)').
          attr('class', 'line').
          attr('d', line);

        totalLength = path.node().getTotalLength();

        path.
          attr('stroke-dasharray', totalLength + ' ' + totalLength).
          attr('stroke-dashoffset', totalLength).
          transition().
            duration(1000).
            delay(options.delay).
            ease('cubic').
            attr('stroke-dashoffset', 0);

        svg.selectAll('.axis path, .axis line')
          .style('fill', 'none')
          .style('stroke', '#000000')
          .style('shape-rendering', 'crispEdges');

        svg.selectAll('.line')
          .style('fill', 'none')
          .style('stroke', 'red')
          .style('stroke-width', '1.5px');

      }
    };
  }]);
