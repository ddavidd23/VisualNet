import React, { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

const MLPDiagram = ({ architecture, showBias }) => {
    const svgRef = useRef(null);

    const config = useMemo(() => ({
        edgeWidth: 0.5,
        edgeOpacity: 1.0,
        nodeDiameter: 20,
        nodeColor: "#ffffff",
        nodeBorderColor: "#333333",
        betweenLayers: 80,
        betweenNodesInLayer: 10,
        showArrowheads: false,
        arrowheadStyle: "empty",
        negativeEdgeColor: "#0000ff",
        positiveEdgeColor: "#ff0000",
        defaultEdgeColor: "#505050",
        nominalTextSize: 12
    }), []);

    useEffect(() => {
        const svg = d3.select(svgRef.current).attr("xmlns", "http://www.w3.org/2000/svg");
        svg.selectAll("*").remove();
        const g = svg.append("g");

        const { width, height } = setupDimensions();
        const { graph, label } = createGraphData(architecture, showBias);
        const { link, node, text } = setupGraphElements(g, graph, label);
        
        const scales = createScales(config);
        const marker = createArrowMarker(svg, config);

        function redraw() {
            updateGraphElements(link, node, text, graph, label, config);
            style(link, node, marker, scales, config);
        }

        function redistribute() {
            const { x, y, largestLayerWidth } = calculateNodePositions(architecture, width, height, config);
            positionNodes(node, link, text, x, y, width, largestLayerWidth, config);
        }

        function resize() {
            const { width, height } = setupDimensions();
            svg.attr("width", width).attr("height", height);
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
const setupDimensions = () => ({
    width: window.innerWidth / 3,
    height: window.innerHeight * 2/3
});

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

    const label = architecture.map((layerWidth, layerIndex) => ({ 
        id: `layer_${layerIndex}_label`, 
        layer: layerIndex, 
        text: `${layerWidth} neurons` 
    }));

    return { graph: { nodes, links: filteredLinks }, label };
};

const setupGraphElements = (g, graph, label) => ({
    link: g.selectAll(".link").data(graph.links, d => d.id)
        .enter().insert("path", ".node").attr("class", "link"),
    node: g.selectAll(".node").data(graph.nodes, d => d.id)
        .enter().append("rect").attr("class", "node"),
    text: g.selectAll(".text").data(label, d => d.id)
        .enter().append("text").attr("class", "text")
});

const createScales = ({ edgeWidth, negativeEdgeColor, positiveEdgeColor }) => ({
    weightedEdgeWidth: d3.scaleLinear().domain([0, 1]).range([0, edgeWidth]),
    weightedEdgeOpacity: d3.scaleLinear().domain([0, 1]).range([0, 1]),
    weightedEdgeColor: d3.scaleLinear().domain([-1, 0, 1]).range([negativeEdgeColor, "white", positiveEdgeColor])
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

const updateGraphElements = (link, node, text, graph, label, { nodeDiameter, nominalTextSize }) => {
    link.data(graph.links, d => d.id);
    node.data(graph.nodes, d => d.id)
        .attr("width", nodeDiameter)
        .attr("height", nodeDiameter)
        .attr("id", d => d.id);
    text.data(label, d => d.id)
        .attr("dy", ".35em")
        .style("font-size", `${nominalTextSize}px`)
        .text(d => d.text);
};

const calculateNodePositions = (architecture, width, height, { nodeDiameter, betweenLayers, betweenNodesInLayer }) => {
    const layerWidths = architecture.map(layerWidth => layerWidth * nodeDiameter + (layerWidth - 1) * betweenNodesInLayer);
    const largestLayerWidth = Math.max(...layerWidths);
    const layerOffsets = layerWidths.map(layerWidth => (largestLayerWidth - layerWidth) / 2);

    const x = (layer, nodeIndex) => layerOffsets[layer] + nodeIndex * (nodeDiameter + betweenNodesInLayer) + width / 2 - largestLayerWidth / 2;
    const y = layer => layer * (betweenLayers + nodeDiameter) + height/3 - (betweenLayers * layerOffsets.length / 4) * 3/2;

    return { x, y, largestLayerWidth };
};

const positionNodes = (node, link, text, x, y, width, largestLayerWidth, { nodeDiameter }) => {
    node.attr('x', d => x(d.layer, d.node_index) - nodeDiameter / 2)
        .attr('y', d => y(d.layer) - nodeDiameter / 2);

    link.attr("d", d => {
        const [sourceLayer, sourceIndex] = d.source.split('_').map(Number);
        const [targetLayer, targetIndex] = d.target.split('_').map(Number);
        return `M${x(sourceLayer, sourceIndex)},${y(sourceLayer)} ${x(targetLayer, targetIndex)},${y(targetLayer)}`;
    });

    text.attr("x", d => width / 2 + largestLayerWidth / 2 + 20)
        .attr("y", d => y(d.layer));
};

const style = (link, node, marker, scales, config) => {
    const { edgeWidth, edgeOpacity, nodeColor, nodeBorderColor, showArrowheads, arrowheadStyle, defaultEdgeColor, nodeDiameter } = config;
    const { weightedEdgeWidth, weightedEdgeOpacity, weightedEdgeColor } = scales;

    link.style("stroke-width", d => weightedEdgeWidth(Math.abs(d.weight)))
        .style("stroke-opacity", d => weightedEdgeOpacity(Math.abs(d.weight)))
        .style("stroke", d => weightedEdgeColor(d.weight))
        .style("fill", "none")
        .attr('marker-end', showArrowheads ? "url(#arrow)" : '');

    marker.attr('refX', nodeDiameter * 1.4 + 12);
    marker.select("path").style("fill", arrowheadStyle === 'empty' ? "none" : defaultEdgeColor);

    node.style("fill", nodeColor)
        .style("stroke", nodeBorderColor);
};

export default MLPDiagram;