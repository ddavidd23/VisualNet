import React, { useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as d3 from 'd3';

const WIDTH = 500;
const HEIGHT = 500;
const MARGIN = { top: 10, right: 10, bottom: 20, left: 30 };
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

const MODEL_FUNCTIONS = [
    (x) => Math.pow(x, 2),
    (x) => Math.sin(2 * Math.PI * x) + Math.cos(3 * Math.PI * x),
    (x) => Math.log(x + 1) * x,
];

const MODEL_DOMAINS = [
    Array(1001).fill().map((_, i) => (i - 500) / 100)
];

export default function Graph({ modelFunctionIdx, predictions }) {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current)
            .attr('width', WIDTH)
            .attr('height', HEIGHT);

        // Clear previous content
        svg.selectAll("*").remove();

        const g = svg.append('g')
            .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

        // scales, axes
        let xScale, yScale;

        if (modelFunctionIdx === 0) {
            xScale = d3.scaleLinear()
                .domain([-4, 4])
                .range([0, INNER_WIDTH]);
            yScale = d3.scaleLinear()
                .domain([0, 17])
                .range([INNER_HEIGHT, 0]);
        }

        const xVals = MODEL_DOMAINS[modelFunctionIdx];

        const modelData = xVals.map((x) => ({
            x: x,
            y: MODEL_FUNCTIONS[modelFunctionIdx](x)
        }));

        const xAxis = d3.axisBottom(xScale).ticks(10);
        const yAxis = d3.axisLeft(yScale).ticks(10);
        const xAxisGrid = d3.axisBottom(xScale).tickSize(-INNER_HEIGHT).tickFormat('').ticks(10);
        const yAxisGrid = d3.axisLeft(yScale).tickSize(-INNER_WIDTH).tickFormat('').ticks(10);

        g.append('g')
            .attr('class', 'x axis-grid')
            .attr('transform', 'translate(0,' + INNER_HEIGHT + ')')
            .call(xAxisGrid);
        g.append('g')
            .attr('class', 'y axis-grid')
            .call(yAxisGrid);

        // Create axes.
        g.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + INNER_HEIGHT + ')')
            .call(xAxis);
        g.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        // line
        const modelLine = d3.line()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .curve(d3.curveCardinal);
        g.selectAll(".model-line")
            .data([modelData])
            .join("path")
            .attr("class", "model-line")
            .attr("d", modelLine)
            .attr("fill", "none")
            .attr("stroke", "#3B82F6");

        if (predictions) {
            const evalLine = d3.line()
                .x((d) => xScale(d.x))
                .y((d) => yScale(d.y))
                .curve(d3.curveCardinal);

            g.selectAll(".eval-line")
                .data([predictions])
                .join("path")
                .attr("class", "eval-line")
                .attr("fill", "none")
                .attr("stroke", "#3B8255")
                .attr("d", evalLine);
        }
    }, [modelFunctionIdx, predictions]);

    return (
        <svg ref={svgRef}></svg>
    );
}