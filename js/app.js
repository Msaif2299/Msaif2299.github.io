/**
 * Code source for bar graph: https://d3-graph-gallery.com/graph/barplot_button_data_hard.html
 * Loading data from JSON file synchronously: https://stackoverflow.com/questions/9364630/using-jquery-getjson-and-fire-a-function-after-the-results-have-been-processed
 * Pound formatting: https://stackoverflow.com/questions/23611180/d3-js-nvd3-axislabel-with-a-%C2%A3-pound-symbol
 * Axis labeling: https://stackoverflow.com/questions/11189284/d3-axis-labeling
 * Tooltip: https://observablehq.com/@bsaienko/animated-bar-chart-with-tooltip
 * Some Map Code: https://d3-graph-gallery.com/graph/choropleth_hover_effect.html
 * **/

const DARK_GREY = "#4f4e4e"
const RED = "#f22c43"
const WHITE = "#fff";
const LIGHT_BLUE = "#A9C4EB"
const LIGHT_GREEN = "#69b3a2"
const BRIGHT_YELLOW = "#eec42d"

var hpi_data = new Map();
var housesales_data = new Map();
var current_selected_region = "";
var barPlotObjects = {
  "svg": null,
  "height": 0,
  "width": 0,
  "margin": null,
  "x": null,
  "y": null,
  "invY": null,
  "xAxis": null,
  "yAxis": null,
  "invYAxis": null,
};

var mapRegions = {}

function loadData(dblocation, map, funcToCallAfterDataLoaded) {
  $.getJSON(dblocation, (data) => {
    var dataLen = Object.keys(data).length;
    var counter = 1;
    $.each(data, function(key, value) {
      value.unshift([value[0][0]-1, 0])
      map.set(key, value);
      if(dataLen == counter) {
        funcToCallAfterDataLoaded();
      }
      counter++;
    });
  });
}

function generateRegionsRadioOptions() {
    var oneValChecked = false;
  $('#regions').append("<h2><u>Regions:</u></h2>")
    for([key, value] of housesales_data) {
      let html = "<input type=\"radio\" id=\"" + key + "\" name = \"region_selector\" value=\"" + key + "\"";
      if (!oneValChecked) {
        oneValChecked = true;
        html += " checked ";
        current_selected_region = key;
      }
      html += ">\n" + "  <label for=\"" + key + "\">" + key + "</label><br>";
      $('#regions').append(html);
    }

}

function radioButtonChange() {
  current_selected_region = $("input[name='region_selector']:checked").val();
  updateBarGraph();
}

function hoverOverBar(d, i) {
  var format = d3.format(",d")
  tooltip
    .html(`
            <div>Region: ${current_selected_region}</div>
            <div>Year: ${d[0]}</div>
            <div>Avg. House Price: £ ${format(hpi_data.get(current_selected_region)[i][1])}</div>
            <div>Number of house sales: ${format(housesales_data.get(current_selected_region)[i][1])}</div>
          `)
    .style('visibility', 'visible');
  d3.select(this).transition().attr('fill', BRIGHT_YELLOW);
}

function loadDoubleBarGraph() {
  var margin = {top: 30, right: 30, bottom: 70, left: 80};
  barPlotObjects['width'] = 1000 - margin.left - margin.right;
  barPlotObjects['height'] = 400 - margin.top - margin.bottom;

  barPlotObjects['margin'] = margin;

// append the svg object to the body of the page
  barPlotObjects['svg'] = d3.select("#doublebar")
    .append("svg")
    .attr("width", barPlotObjects.width + margin.left + margin.right)
    .attr("height", 2*barPlotObjects.height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

// X axis
  barPlotObjects['x'] = d3.scaleBand()
    .range([ 0, barPlotObjects.width ])
    .padding(0.2);


// Add Y axis
  barPlotObjects['y'] = d3.scaleLinear()
    .range([ barPlotObjects.height, 0]);
  barPlotObjects['yAxis'] = barPlotObjects.svg.append("g")
    .attr("class", "myYaxis")

// Add inverted Y axis
  barPlotObjects['invY'] = d3.scaleLinear()
    .range([0, barPlotObjects.height]);
  barPlotObjects['invYAxis'] = barPlotObjects.svg.append("g")
    .attr("transform", "translate(0," + barPlotObjects.height + ")")
    .attr("class", "myInvertedYaxis")

  updateBarGraph();
}

function updateBarGraph() {
  var data1 = hpi_data.get(current_selected_region);
  // Update the X axis
  barPlotObjects.x.domain(data1.map(function(d) { return d[0]; }));


  // Update the Y axis
  barPlotObjects.y.domain([0, d3.max(data1, function(d) { return d[1] }) ]);
  barPlotObjects.yAxis.transition().duration(1000).call(d3.axisLeft(barPlotObjects.y).tickFormat(
    (d) => {
      var format = d3.format(",d")
      return "£"+ format(d);
    }
  ));

  tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'd3-tooltip')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .style('padding', '10px')
    .style('background', 'rgba(0,0,0,0.6)')
    .style('border-radius', '4px')
    .style('color', WHITE)
    .text('a simple tooltip');

  var u = barPlotObjects.svg.selectAll(".bar1")
    .data(data1);
  u
    .enter()
    .append("rect")
    .attr("class", "bar1")
    .merge(u)
    .attr("x", function(d) { return barPlotObjects.x(d[0]) - 18; })
    .attr("y", function(d) { return barPlotObjects.y(d[1]); })
    .attr("width", barPlotObjects.x.bandwidth() + 6)
    .attr("height", function(d) { return barPlotObjects.height - barPlotObjects.y(d[1]); })
    .attr("fill", LIGHT_GREEN)
    .on('mouseover', hoverOverBar)
    .on('mousemove', function () {
      tooltip
        .style('top', d3.event.pageY - 10 + 'px')
        .style('left', d3.event.pageX + 10 + 'px');
    })
    .on('mouseout', function () {
      tooltip.html(``).style('visibility', 'hidden');
      d3.select(this).transition().attr('fill', LIGHT_GREEN);
    });

  u
    .transition()
    .duration(1000)

  u.exit().remove();

  data2 = housesales_data.get(current_selected_region);

  // Update the Y axis
  barPlotObjects.invY.domain([0, d3.max(data2, function(d) { return d[1] }) ]);
  barPlotObjects.invYAxis.transition().duration(1000).call(d3.axisLeft(barPlotObjects.invY));

  u = barPlotObjects.svg.selectAll(".bar2")
    .data(data2);
  u
    .enter()
    .append("rect")
    .attr("class", "bar2")
    .merge(u)
    .attr("x", function(d) { return barPlotObjects.x(d[0]) - 18; })
    .attr("y", function(d) { return barPlotObjects.height; })
    .attr("width", barPlotObjects.x.bandwidth() + 6)
    .attr("height", function(d) { return barPlotObjects.invY(d[1]); })
    .attr("fill", LIGHT_BLUE)
    .on('mouseover', hoverOverBar)
    .on('mousemove', function () {
      tooltip
        .style('top', d3.event.pageY - 10 + 'px')
        .style('left', d3.event.pageX + 10 + 'px');
    })
    .on('mouseout', function () {
      tooltip.html(``).style('visibility', 'hidden');
      d3.select(this).transition().attr('fill', LIGHT_BLUE);
    });

  u
    .transition()
    .duration(1000);

  u.exit().remove();

  // Render X Axis on top of double bars
  barPlotObjects['xAxis'] = barPlotObjects.svg.append("g")
    .attr("transform", "translate(0," + barPlotObjects.height + ")")
    .attr("class", "myXaxis")
  barPlotObjects.xAxis.call(d3.axisBottom(barPlotObjects.x));

  barPlotObjects.svg.append("g")
    .attr('transform', 'translate(' + (-60) + ', ' + (barPlotObjects.height/2) + ')')
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("font-family", "Helvetica")
    .text("Average House Price (All Dwellings) →");

  barPlotObjects.svg.append("g")
    .attr('transform', 'translate(' + (-60) + ', ' + (1.5*barPlotObjects.height) + ')')
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("font-family", "Helvetica")
    .text("← Number of House Sales");

  colorRegion();
}

function loadMap() {
  d3.json("data/uk.geojson", (geojson) => {
    let svg = d3.select("#displaymap").append("svg")
      .attr("width", 300)
      .attr("height", 250)
      .append("g")
    let projection = d3.geoIdentity().reflectY(true).fitExtent([[40, 0], [300, 250]], geojson);
    let geoGenerator = d3.geoPath().projection(projection);
    let u = svg
      .selectAll("path")
      .data(geojson.features)
      .enter().append("path")
      .attr("d", geoGenerator)
      .style("stroke", DARK_GREY)
      .style("fill", "grey")
      .attr("class", function(d){
        return `${d.properties.rgn_name[0].replace(/ /g,"_")} ${d.properties.ctry_name[0].replace(/ /g,"_")} region`;
      })
      .style("opacity", .8)
      colorRegion();
  })

}

function colorRegion() {
  d3.selectAll(".region").style("fill", "grey")
  if(current_selected_region == "England and Wales") {
    d3.selectAll(`.England`).style("fill", RED)
    d3.selectAll(`.Wales`).style("fill", RED)
    return
  }
  d3.selectAll(`.${current_selected_region.replace(/ /g,"_")}`).style("fill", RED)
}


function nonDataDependentMain() {
  $("#regions").change(radioButtonChange);
}

function dataDependentMain() {
  loadData("data/housesales_data.json", housesales_data, () => {
    generateRegionsRadioOptions();
    loadData("data/hpi_data.json", hpi_data, () => {
      loadDoubleBarGraph();
      loadMap();
    });
  });

}

function main() {
  $("#tabs").tabs();
  nonDataDependentMain();
  dataDependentMain();
}

$(main);
