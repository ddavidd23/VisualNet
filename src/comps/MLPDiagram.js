import React, { useEffect, useRef } from "react";
import * as d3 from "d3";


export default function MLPDiagram({ architecture, showBias, showLabels }) {
    const svgRef = useRef(null);

    useEffect(() => {
        const svg = d3.select(svgRef.current).attr("xmlns", "http://www.w3.org/2000/svg");
        svg.selectAll("*").remove();
        const g = svg.append("g");

        let randomWeight = () => Math.random() * 2 - 1;

        var w = window.innerWidth;
        var h = window.innerHeight;

        var edgeWidthProportional = false;
        var edgeWidth = 0.5;
        var weightedEdgeWidth = d3.scaleLinear().domain([0, 1]).range([0, edgeWidth]);

        var edgeOpacityProportional = false;
        var edgeOpacity = 1.0;
        var weightedEdgeOpacity = d3.scaleLinear().domain([0, 1]).range([0, 1]);

        var edgeColorProportional = false;
        var defaultEdgeColor = "#505050";
        var negativeEdgeColor = "#0000ff";
        var positiveEdgeColor = "#ff0000";
        var weightedEdgeColor = d3.scaleLinear().domain([-1, 0, 1]).range([negativeEdgeColor, "white", positiveEdgeColor]);

        var nodeDiameter = 20;
        var nodeColor = "#ffffff";
        var nodeBorderColor = "#333333";

        var betweenLayers = 80;

        var betweenNodesInLayer = Array(architecture.length).fill(10);
        var graph = {};
        var layer_offsets = [];
        var largest_layer_width = 0;
        var showArrowheads = false;
        var arrowheadStyle = "empty";

        let textFn = (_, layer_width) => (layer_width.toString() + " neurons");
        var nominal_text_size = 12;

        var marker = svg.append("svg:defs").append("svg:marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("markerWidth", 7)
            .attr("markerHeight", 7)
            .attr("orient", "auto");

        var arrowhead = marker.append("svg:path")
            .attr("d", "M0,-5L10,0L0,5")
            .style("stroke", defaultEdgeColor);

        var link = g.selectAll(".link");
        var node = g.selectAll(".node");
        var text = g.selectAll(".text");

        /////////////////////////////////////////////////////////////////////////////
        ///////    Methods    ///////
        /////////////////////////////////////////////////////////////////////////////

        function redraw({ architecture_ = architecture,
            showBias_ = showBias,
            showLabels_ = showLabels
        } = {}) {

            architecture = architecture_;
            showBias = showBias_;
            showLabels = showLabels_;

            graph.nodes = architecture.map((layer_width, layer_index) => range(layer_width).map(node_index => { return { 'id': layer_index + '_' + node_index, 'layer': layer_index, 'node_index': node_index } }));
            graph.links = pairWise(graph.nodes).map((nodes) => nodes[0].map(left => nodes[1].map(right => { return right.node_index >= 0 ? { 'id': left.id + '-' + right.id, 'source': left.id, 'target': right.id, 'weight': randomWeight() } : null })));
            graph.nodes = flatten(graph.nodes);
            graph.links = flatten(graph.links).filter(l => (l && (showBias ? (parseInt(l['target'].split('_')[0]) !== architecture.length - 1 ? (l['target'].split('_')[1] !== '0') : true) : true)));

            let label = architecture.map((layer_width, layer_index) => { return { 'id': 'layer_' + layer_index + '_label', 'layer': layer_index, 'text': textFn(layer_index, layer_width) } });

            link = link.data(graph.links, d => d.id);
            link.exit().remove();
            link = link.enter()
                .insert("path", ".node")
                .attr("class", "link")
                .merge(link);

            node = node.data(graph.nodes, d => d.id);
            node.exit().remove();
            node = node.enter()
                .append("rect")
                .attr("width", nodeDiameter)
                .attr("height", nodeDiameter)
                .attr("class", "node")
                .attr("id", function (d) { return d.id; })
                .merge(node);

            text = text.data(label, d => d.id);
            text.exit().remove();
            text = text.enter()
                .append("text")
                .attr("class", "text")
                .attr("dy", ".35em")
                .style("font-size", nominal_text_size + "px")
                .merge(text)
                .text(function (d) { return (showLabels ? d.text : ""); });

            style();
        }

        function redistribute({ betweenNodesInLayer_ = betweenNodesInLayer,
            betweenLayers_ = betweenLayers} = {}) {

            betweenNodesInLayer = betweenNodesInLayer_;
            betweenLayers = betweenLayers_;

            let layer_widths = architecture.map((layer_width, i) => layer_width * nodeDiameter + (layer_width - 1) * betweenNodesInLayer[i]);

            largest_layer_width = Math.max(...layer_widths);

            layer_offsets = layer_widths.map(layer_width => (largest_layer_width - layer_width) / 2);

            let indices_from_id = (id) => id.split('_').map(x => parseInt(x));
            
            let x = (layer, node_index) => layer_offsets[layer] + node_index * (nodeDiameter + betweenNodesInLayer[layer]) + w / 2 - largest_layer_width / 2;
            let y = (layer) => layer * (betweenLayers + nodeDiameter) + h/3 - (betweenLayers * layer_offsets.length / 4);

            node.attr('x', function (d) { return x(d.layer, d.node_index) - nodeDiameter / 2; })
                .attr('y', function (d) { return y(d.layer) - nodeDiameter / 2; });

            link.attr("d", (d) => "M" + x(...indices_from_id(d.source)) + "," +
                y(...indices_from_id(d.source)) + ", " +
                x(...indices_from_id(d.target)) + "," +
                y(...indices_from_id(d.target)));

            text.attr("x", function (d) { return w / 2 + largest_layer_width / 2 + 20 })
                .attr("y", function (d) { return y(d.layer) });

        }

        function style({ edgeWidthProportional_ = edgeWidthProportional,
            edgeWidth_ = edgeWidth,
            edgeOpacityProportional_ = edgeOpacityProportional,
            edgeOpacity_ = edgeOpacity,
            negativeEdgeColor_ = negativeEdgeColor,
            positiveEdgeColor_ = positiveEdgeColor,
            edgeColorProportional_ = edgeColorProportional,
            defaultEdgeColor_ = defaultEdgeColor,
            nodeDiameter_ = nodeDiameter,
            nodeColor_ = nodeColor,
            nodeBorderColor_ = nodeBorderColor,
            showArrowheads_ = showArrowheads,
            arrowheadStyle_ = arrowheadStyle} = {}) {
            // Edge Width
            edgeWidthProportional = edgeWidthProportional_;
            edgeWidth = edgeWidth_;
            weightedEdgeWidth = d3.scaleLinear().domain([0, 1]).range([0, edgeWidth]);
            // Edge Opacity
            edgeOpacityProportional = edgeOpacityProportional_;
            edgeOpacity = edgeOpacity_;
            // Edge Color
            defaultEdgeColor = defaultEdgeColor_;
            edgeColorProportional = edgeColorProportional_;
            negativeEdgeColor = negativeEdgeColor_;
            positiveEdgeColor = positiveEdgeColor_;
            weightedEdgeColor = d3.scaleLinear().domain([-1, 0, 1]).range([negativeEdgeColor, "white", positiveEdgeColor]);
            // Node Styles
            nodeDiameter = nodeDiameter_;
            nodeColor = nodeColor_;
            nodeBorderColor = nodeBorderColor_;
            // Arrowheads
            showArrowheads = showArrowheads_;
            arrowheadStyle = arrowheadStyle_;

            link.style("stroke-width", function (d) {
                if (edgeWidthProportional) { return weightedEdgeWidth(Math.abs(d.weight)); } else { return edgeWidth; }
            });

            link.style("stroke-opacity", function (d) {
                if (edgeOpacityProportional) { return weightedEdgeOpacity(Math.abs(d.weight)); } else { return edgeOpacity; }
            });

            link.style("stroke", function (d) {
                if (edgeColorProportional) { return weightedEdgeColor(d.weight); } else { return defaultEdgeColor; }
            });

            link.style("fill", "none");

            link.attr('marker-end', showArrowheads ? "url(#arrow)" : '');
            marker.attr('refX', nodeDiameter * 1.4 + 12);
            arrowhead.style("fill", arrowheadStyle === 'empty' ? "none" : defaultEdgeColor);

            node.style("fill", nodeColor);
            node.style("stroke", nodeBorderColor);

        }

        function resize() {
            w = window.innerWidth/2;
            h = window.innerHeight - 600;
            svg.attr("width", w).attr("height", h);
            redistribute();
        }

        d3.select(window).on("resize", resize);

        resize();

        /////////////////////////////////////////////////////////////////////////////
        ///////    Return    ///////
        /////////////////////////////////////////////////////////////////////////////

        redraw();
        redistribute();
        style();
    }, [architecture, showBias, showLabels]);

    return (
        // <div id="graph-container">
        <svg ref={svgRef} className="h-max"/>
        // </div>
    );
}

const range = (n) => Array.from({ length: n }, (v, k) => k);
const flatten = (arr) => arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten), []);
const pairWise = (arr) => arr.slice(0, -1).map((e, i) => [e, arr[i + 1]]);