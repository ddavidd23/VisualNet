import React, { useEffect, useRef, useState } from "react";
import * as d3 from 'd3';

const MARGIN = { top: 10, right: 10, bottom: 20, left: 30 };

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
    const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

    useEffect(() => {
        const updateDimensions = () => {
            const width = window.innerWidth / 3;
            const height = width;
            setDimensions({ width, height });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    useEffect(() => {
        const { width, height } = dimensions;
        const innerWidth = width - MARGIN.left - MARGIN.right;
        const innerHeight = height - MARGIN.top - MARGIN.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Clear previous content
        svg.selectAll("*").remove();

        const g = svg.append('g')
            .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

        // scales, axes
        let xScale, yScale;

        if (modelFunctionIdx === 0) {
            xScale = d3.scaleLinear()
                .domain([-4, 4])
                .range([0, innerWidth]);
            yScale = d3.scaleLinear()
                .domain([0, 17])
                .range([innerHeight, 0]);
        }

        const xVals = MODEL_DOMAINS[modelFunctionIdx];

        const modelData = xVals.map((x) => ({
            x: x,
            y: MODEL_FUNCTIONS[modelFunctionIdx](x)
        }));

        const xAxis = d3.axisBottom(xScale).ticks(10);
        const yAxis = d3.axisLeft(yScale).ticks(10);
        const xAxisGrid = d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat('').ticks(10);
        const yAxisGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat('').ticks(10);

        g.append('g')
            .attr('class', 'x axis-grid')
            .attr('transform', 'translate(0,' + innerHeight + ')')
            .call(xAxisGrid);
        g.append('g')
            .attr('class', 'y axis-grid')
            .call(yAxisGrid);

        // Create axes.
        g.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + innerHeight + ')')
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
    }, [modelFunctionIdx, predictions, dimensions]);

    return (
        <div className="graph-container">
            <svg ref={svgRef}></svg>
        </div>
    );
}
