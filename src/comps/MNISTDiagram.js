import React, { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

const INPUT_WIDTH_FACTOR = 16;
const LINKS_FROM_INPUT_LAYER = 5; // Number of links from the input layer

const MNISTDiagram = ({ architecture, showBias, parentRef }) => {
    const svgRef = useRef(null);

    const config = useMemo(() => ({
        edgeWidth: 0.5,
        nodeSize: 10,
        nodeColor: "#ffffff",
        nodeBorderColor: "#333333",
        betweenLayers: 60,
        betweenNodesInLayer: 2,
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

        const { width, height, viewBox } = setupDimensions(parentRef);
        const { graph } = createGraphData(architecture, showBias);
        const { link, node } = setupGraphElements(g, graph);

        const scales = createScales(config);
        const marker = createArrowMarker(svg, config);

        function redraw() {
            updateGraphElements(link, node, graph, config, architecture);
            style(link, node, marker, scales, config);
        }

        function redistribute() {
            const { x, y, largestLayerWidth, diagramWidth, diagramHeight } = calculateNodePositions(architecture, width, height, config);
            positionNodes(node, link, x, y, config);
        
            // Center the diagram
            const scale = Math.min(width / diagramWidth, height / diagramHeight);
            const translateX = (width - diagramWidth * scale) / 2;
            const translateY = (height - diagramHeight * scale) / 2;
            g.attr("transform", `translate(${translateX},${translateY}) scale(${scale})`);
        }
        

        function resize() {
            const { width, height, viewBox } = setupDimensions(parentRef);
            svg.attr("width", width).attr("height", height).attr("viewBox", viewBox);

            redistribute();
        }

        d3.select(window).on("resize", resize);

        resize();
        redraw();
        redistribute();
    }, [architecture, showBias, config, parentRef]);

    return (
        <svg ref={svgRef}/>
    );
};

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
    const nodes = architecture.flatMap((layerWidth, layerIndex) => {
        if (layerIndex === 0) {
            return [{ id: "0_0", layer: 0, node_index: 0 }];
        }
        return Array.from({ length: layerWidth }, (_, nodeIndex) => ({
            id: `${layerIndex}_${nodeIndex}`,
            layer: layerIndex,
            node_index: nodeIndex
        }));
    });

    const links = [];
    for (let i = 0; i < architecture.length - 1; i++) {
        for (let j = 0; j < (i === 0 ? LINKS_FROM_INPUT_LAYER : architecture[i]); j++) {
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

const updateGraphElements = (link, node, graph, { nodeSize }, architecture) => {
    link.data(graph.links, d => d.id);
    node.data(graph.nodes, d => d.id)
        .attr("width", d => d.layer === 0 ? nodeSize * INPUT_WIDTH_FACTOR: nodeSize)
        .attr("height", nodeSize)
        .attr("id", d => d.id);
};

const calculateNodePositions = (architecture, width, height, { nodeSize, betweenLayers, betweenNodesInLayer }) => {
    const layerWidths = architecture.map((layerWidth, layerIndex) => {
        if (layerIndex === 0) {
            return nodeSize * INPUT_WIDTH_FACTOR;
        }
        return layerWidth * nodeSize + (layerWidth - 1) * betweenNodesInLayer;
    });
    const largestLayerWidth = Math.max(...layerWidths);
    const layerOffsets = layerWidths.map(layerWidth => (largestLayerWidth - layerWidth) / 2);

    const x = (layer, nodeIndex) => {
        if (layer === 0) {
            return (nodeIndex + 1) * (nodeSize + betweenNodesInLayer) * (INPUT_WIDTH_FACTOR / LINKS_FROM_INPUT_LAYER) - nodeSize * INPUT_WIDTH_FACTOR * 0.75;
        }
        return layerOffsets[layer] + nodeIndex * (nodeSize + betweenNodesInLayer) - largestLayerWidth / 2;
    };
    const y = layer => layer * (betweenLayers + nodeSize) - architecture.length * 15;

    const diagramWidth = largestLayerWidth;
    const diagramHeight = (architecture.length - 1) * (betweenLayers + nodeSize);

    return { x, y, largestLayerWidth, diagramWidth, diagramHeight };
};

const positionNodes = (node, link, x, y, { nodeSize }) => {
    node.attr('x', d => x(d.layer, d.node_index) - nodeSize / 2)
        .attr('y', d => y(d.layer) - nodeSize / 2);

    link.attr("d", d => {
        const [sourceLayer, sourceIndex] = d.source.split('_').map(Number);
        const [targetLayer, targetIndex] = d.target.split('_').map(Number);
        return `M${x(sourceLayer, sourceIndex)},${y(sourceLayer)} ${x(targetLayer, targetIndex)},${y(targetLayer)}`;
    });
};

const style = (link, node, marker, scales, config) => {
    const { edgeWidth, nodeColor, nodeBorderColor, showArrowheads, arrowheadStyle, defaultEdgeColor, nodeSize } = config;
    const { weightedEdgeColor } = scales;

    link.style("stroke-width", edgeWidth)
        .style("stroke", d => weightedEdgeColor(d.weight))
        .style("stroke-opacity", 1)
        .style("fill", "none")
        .attr('marker-end', showArrowheads ? "url(#arrow)" : '');

    marker.attr('refX', nodeSize * 1.4 + 12);
    marker.select("path").style("fill", arrowheadStyle === 'empty' ? "none" : defaultEdgeColor);

    node.style("fill", nodeColor)
        .style("stroke", nodeBorderColor);
};

export default MNISTDiagram;
