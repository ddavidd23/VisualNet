import React, { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

const INPUT_WIDTH_FACTOR = 16;
const LINKS_FROM_INPUT_LAYER = 5;

const MLPDiagram = ({ architecture, showBias, parentRef }) => {
    const svgRef = useRef(null);

    const config = useMemo(() => ({
        edgeWidth: 0.5,
        nodeDiameter: 20,
        nodeColor: "#ffffff",
        nodeBorderColor: "#333333",
        betweenLayers: 60,
        betweenNodesInLayer: 10,
        showArrowheads: false,
        arrowheadStyle: "empty",
        negativeEdgeColor: "#9E58B4",
        positiveEdgeColor: "#3B82F6",
        defaultEdgeColor: "#7174E2",
        nominalTextSize: 12
    }), []);

    useEffect(() => {
        const svg = d3.select(svgRef.current).attr("xmlns", "http://www.w3.org/2000/svg");
        svg.selectAll("*").remove();
        const g = svg.append("g");

        const { width, height } = setupDimensions(parentRef);
        const { graph } = createGraphData(architecture, showBias);
        const { link, node } = setupGraphElements(g, graph);

        const scales = createScales(config);
        const marker = createArrowMarker(svg, config);

        function redraw() {
            updateGraphElements(link, node, graph, config);
            style(link, node, marker, scales, config);
        }

        function redistribute() {
            const { x, y, largestLayerWidth } = calculateNodePositions(architecture, width, height, config);
            positionNodes(node, link, x, y, width, largestLayerWidth, config);
        }

        function resize() {
            const { width, height } = setupDimensions(parentRef);
            svg.attr("width", width).attr("height", height);

            // Calculate vertical translation based on the number of layers
            const numLayers = architecture.length;
            const verticalTranslation = height / 2 - (numLayers * config.betweenLayers) / 2;
            g.attr("transform", `translate(${width / 2}, ${verticalTranslation})`); // Center the group and move up as more layers are added

            redistribute();
        }


        d3.select(window).on("resize", resize);

        resize();
        redraw();
        redistribute();
    }, [architecture, showBias, config]);

    return <svg ref={svgRef} />;
};

// Helper functions
const setupDimensions = (parentRef) => {
    const parentElement = parentRef.current;
    const {width, height} = parentElement.getBoundingClientRect();
    return {
        width,
        height,
        viewBox: `${-width} ${-height/2} ${width*2} ${height*3/2}`
    };
};

const createGraphData = (architecture, showBias) => {
    const nodes = architecture.flatMap((layerWidth, layerIndex) => 
        Array.from({ length: layerWidth }, (_, nodeIndex) => ({ 
            id: `${layerIndex}_${nodeIndex}`, 
            layer: layerIndex, 
            node_index: nodeIndex 
        }))
    );

    const links = [];
    for (let i = 0; i < architecture.length - 1; i++) {
        for (let j = 0; j < architecture[i]; j++) {
            for (let k = 0; k < architecture[i + 1]; k++) {
                links.push({
                    id: `${i}_${j}-${i+1}_${k}`,
                    source: `${i}_${j}`,
                    target: `${i+1}_${k}`,
                    weight: Math.random() * 2 - 1
                });
            }
        }
    }

    const filteredLinks = links.filter(link => 
        showBias || 
        link.target.split('_')[1] !== '0' || 
        parseInt(link.target.split('_')[0]) === architecture.length - 1
    );

    return { graph: { nodes, links: filteredLinks } };
};

const setupGraphElements = (g, graph) => ({
    link: g.selectAll(".link").data(graph.links, d => d.id)
        .enter().insert("path", ".node").attr("class", "link"),
    node: g.selectAll(".node").data(graph.nodes, d => d.id)
        .enter().append("rect").attr("class", "node")
});

const createScales = ({ negativeEdgeColor, positiveEdgeColor }) => ({
    weightedEdgeColor: d3.scaleLinear().domain([-1, 0, 1]).range([negativeEdgeColor, positiveEdgeColor])
});

const createArrowMarker = (svg, { defaultEdgeColor }) => {
    const marker = svg.append("svg:defs").append("svg:marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("markerWidth", 7)
        .attr("markerHeight", 7)
        .attr("orient", "auto");

    marker.append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .style("stroke", defaultEdgeColor);

    return marker;
};

const updateGraphElements = (link, node, graph, { nodeDiameter }) => {
    link.data(graph.links, d => d.id);
    node.data(graph.nodes, d => d.id)
        .attr("width", nodeDiameter)
        .attr("height", nodeDiameter)
        .attr("id", d => d.id);
};

const calculateNodePositions = (architecture, width, height, { nodeDiameter, betweenLayers, betweenNodesInLayer }) => {
    const layerWidths = architecture.map(layerWidth => layerWidth * nodeDiameter + (layerWidth - 1) * betweenNodesInLayer);
    const largestLayerWidth = Math.max(...layerWidths);
    const layerOffsets = layerWidths.map(layerWidth => (largestLayerWidth - layerWidth) / 2);

    const x = (layer, nodeIndex) => {
        return layerOffsets[layer] + nodeIndex * (nodeDiameter + betweenNodesInLayer) - largestLayerWidth / 2;
    };
    const y = layer => layer * (betweenLayers + nodeDiameter) - architecture.length * 8;
    return { x, y, largestLayerWidth };
};

const positionNodes = (node, link, x, y, width, largestLayerWidth, { nodeDiameter }) => {
    node.attr('x', d => x(d.layer, d.node_index) - nodeDiameter / 2)
        .attr('y', d => y(d.layer) - nodeDiameter / 2);

    link.attr("d", d => {
        const [sourceLayer, sourceIndex] = d.source.split('_').map(Number);
        const [targetLayer, targetIndex] = d.target.split('_').map(Number);
        return `M${x(sourceLayer, sourceIndex)},${y(sourceLayer)} ${x(targetLayer, targetIndex)},${y(targetLayer)}`;
    });
};

const style = (link, node, marker, scales, config) => {
    const { edgeWidth, nodeColor, nodeBorderColor, showArrowheads, arrowheadStyle, defaultEdgeColor, nodeDiameter } = config;
    const { weightedEdgeColor } = scales;

    link.style("stroke-width", edgeWidth)
        .style("stroke", d => weightedEdgeColor(d.weight))
        .style("stroke-opacity", 1)
        .style("fill", "none")
        .attr('marker-end', showArrowheads ? "url(#arrow)" : '');

    marker.attr('refX', nodeDiameter * 1.4 + 12);
    marker.select("path").style("fill", arrowheadStyle === 'empty' ? "none" : defaultEdgeColor);

    node.style("fill", nodeColor)
        .style("stroke", nodeBorderColor);
};

export default MLPDiagram;
