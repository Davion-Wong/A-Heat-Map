import React, {useState, useRef, useEffect} from "react";
import * as d3 from 'd3';

const HeatMap = () => {

  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
      });
  }, []);

  useEffect(() => {

    if(!data) return;
    const baseTemp = data.baseTemperature;

    const width = 1440;
    const height = 580;
    const margin = {top: 80, bottom: 40, left: 120, right: 180};
    const cellWidth = (width - margin.left - margin.right) / (d3.max(data.monthlyVariance, d => d.year) - d3.min(data.monthlyVariance, d => d.year) + 1);
    const legendWidth = 300;
    const legendHeight = 20;
    const legendMargin = 10;

    let svg = d3.select("#heatmap").select("svg");
    if(svg.empty()) {
      svg = d3.select("#heatmap")
              .append("svg")
              .attr("width", width)
              .attr("height", height);
    }

    const baseVariance = d3.min(data.monthlyVariance, d => d.variance + baseTemp);
    const maxVariance = d3.max(data.monthlyVariance, d => d.variance + baseTemp);
    const varianceRange = d3.max(data.monthlyVariance, d => d.variance + baseTemp) - d3.min(data.monthlyVariance, d => d.variance + baseTemp);
    
    const legendSvg = svg.append('g')
                         .attr('id', 'legend')
                         .attr('transform', `translate(${width / 2 - legendWidth / 2}, ${legendHeight + legendMargin})`);
    const legendXScale = d3.scaleLinear()
                           .domain([baseVariance, maxVariance])
                           .range([0, legendWidth]);
    const legendColorScale = d3.scaleQuantize()
                               .domain([baseVariance, maxVariance])
                               .range(["#55CCFF", "#77CCCC", "#99CC99", "#BBCC66", "#DDCC33", "#FFCC00"]);
    const step = varianceRange / (legendColorScale.range().length);
    const tickValues = Array.from({length: legendColorScale.range().length + 1}, (_, i) => d3.min(data.monthlyVariance, d => d.variance + baseTemp) + i * step);

    const legendXAxis = d3.axisBottom(legendXScale)
                          .tickValues(tickValues)
                          .tickFormat(d3.format(".2f"));

    legendSvg.selectAll('rect')
             .data(legendColorScale.range())
             .enter()
             .append('rect')
             .attr('height', legendHeight)
             .attr('x', (d, i) => i * legendWidth / legendColorScale.range().length)
             .attr('width', legendWidth / legendColorScale.range().length)
             .attr('fill', d => d);
                
    legendSvg.append("g")
             .attr("transform", `translate(0, ${legendHeight})`)
             .call(legendXAxis);

    const xScale = d3.scaleLinear()
                     .domain([d3.min(data.monthlyVariance, d => d.year), d3.max(data.monthlyVariance, d => d.year)])
                     .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
                     .domain(d3.range(1, 13))
                     .range([margin.top, height - 1 * margin.bottom]);

    const colorScale = d3.scaleQuantize()
                         .domain([d3.min(data.monthlyVariance, d => d.variance), d3.max(data.monthlyVariance, d => d.variance)])
                         .range(["#55CCFF", "#77CCCC", "#99CC99", "#BBCC66", "#DDCC33", "#FFCC00"]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
                    .tickFormat( monthIndex => d3.timeFormat("%B")(new Date(0, monthIndex - 1)));

    svg.append("g")
       .attr("id", "x-axis")
       .attr("transform", `translate(0, ${height - 1 * margin.bottom})`)
       .call(xAxis);

    svg.append("g")
       .attr("id", "y-axis")
       .attr("transform", `translate(${margin.left}, ${- 0 * margin.bottom})`)
       .call(yAxis);
    
    let lineHeight = 14;
    let padding = 5;

    svg.selectAll('.cell')
       .data(data.monthlyVariance)
       .enter()
       .append('rect')
       .attr("class", "cell")
       .attr("x", d => xScale(d.year))
       .attr("y", d => yScale(d.month))
       .attr("width", cellWidth)
       .attr("height", yScale.bandwidth())
       .attr("fill", d => colorScale(d.variance))
       .attr("data-month", d => d.month - 1)
       .attr("data-year", d => d.year)
       .attr("data-temp", d => baseTemp + d.variance)
       .on('mouseover', (event, d) => {
            let text1 = `Year: ${d.year}`;
            let text2 = `Month: ${d3.timeFormat("%B")(new Date(0, d.month - 1))}`;
            let text3 = `Temperature: ${(baseTemp + d.variance).toFixed(3)}`;
        
            tooltipText1.text(text1);
            tooltipText2.text(text2);
            tooltipText3.text(text3);

            let maxLength = Math.max(text1.length, text2.length, text3.length);
            let boxWidth = maxLength * 8; 

            tooltipBox.attr("width", boxWidth)
                      .attr("height", 3 * lineHeight + (2 * padding))
                      .attr("y", 0);
            tooltip.style('visibility', 'visible')
                   .attr('transform', `translate(${xScale(d.year+10)}, ${yScale(d.month)})`);
            d3.select(event.currentTarget).style('stroke', 'red').style('stroke-width', '2');
            event.preventDefault();
        })
        .on('mouseout', (event, d) => {
          tooltip.style('visibility', 'hidden');
          d3.select(event.currentTarget).style('stroke', 'none');
        });

        let tooltip = svg.append("g")
           .attr("id", "tooltip")
           .style("visibility", "hidden");
    
        let tooltipBox = tooltip.append("rect")
               .attr("id", "tooltip-box")
               .style("fill", "lightgrey")
               .style("opacity", "0.8")
               .style("border", "solid")
               .style("border-width", "1px")
               .style("border-radius", "5px")
               .style("padding", "5px");
        let tooltipText1 = tooltip.append("text")
               .attr("id", "tooltip-text1")
               .attr("y", "16");
        let tooltipText2 = tooltip.append("text")
               .attr("id", "tooltip-text2")
               .attr("y", "32");
        let tooltipText3 = tooltip.append("text")
               .attr("id", "tooltip-text3")
               .attr("y", "48");
  
  }, [data]);

  return (
    <div id="heatmap">
      <h1 id="title">Global land surface temperature by years and months</h1>
      <p id="description">A heat map visualisation</p>
    </div>
  );
}

export default HeatMap;