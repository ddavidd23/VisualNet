import React, { useEffect, useRef, useState } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as d3 from 'd3';

function FCNNComponent({ architecture, showBias, showLabels }) {
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
        var textWidth = 70;

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
            let y = (layer) => layer * (betweenLayers + nodeDiameter) + h/3 - (betweenLayers * layer_offsets.length / 3);

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
            w = window.innerWidth;
            h = window.innerHeight;
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
        <div id="graph-container">
            <svg ref={svgRef} width="100%" height="100%" />
        </div>
    );
}

function IncDecButton({ labelText, valueText, onClickDec, onClickInc }) {
    return (
        <form className="mb-2">
            <label className="block mb-2 text-sm">{labelText}</label>
            <div className="flex items-center">
                <button 
                    type="button"
                    id="decrement-button"
                    className="bg-gray-100 flex items-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    onClick={onClickDec}
                >
                    -
                </button>
                <input 
                    type="text"
                    className="bg-white items-center border-x-0 border-gray-300 justify-center text-center text-sm focus:ring-blue-500 focus:border-blue-500 block w-full pt-3 pb-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    value={valueText}
                    readOnly
                />
                <button
                    type="button"
                    id="increment-button"
                    className="bg-gray-100 flex items-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    onClick={onClickInc}
                >
                    +
                </button>
            </div>
        </form>
    );
}

function Slider({ labelText, setState }) {
    const [value, setValue] = useState(500);

    return (
        <>
            <p className="text-sm">{labelText}</p>
            <div className="bg-white rounded-lg px-1 pt-1 w-full border border-gray-300">
                <div>
                    <input 
                        type="range"
                        id="price-range"
                        className="w-full"
                        min="0" max="10000"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setState(e.target.value);
                        }}
                    />
                </div>
                <div className="text-center">
                    <span className="text-sm text-center">{value}</span>
                </div>
            </div>
        </>
    );
}

function MLP() {
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    const [epochs, setEpochs] = useState(500);
    const [showBias, setShowBias] = useState(false);
    const [showLabels, setShowLabels] = useState(true);

    const layerCountDec = () => {
        setHiddenLayers(prev => (prev > 1 ? prev - 1 : 1));
        setNeuronsInLayers(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    };

    const layerCountInc = () => {
        setHiddenLayers(prev => (prev < 6 ? prev + 1 : 6));
        setNeuronsInLayers(prev => (prev.length < 6 ? [...prev, 1] : prev));
    };

    const neuronCountDec = (idx) => {
        setNeuronsInLayers(prev => {
            if (prev[idx] === 1) {
                setHiddenLayers(prevLayers => (prevLayers > 1 ? prevLayers - 1 : 1));
                return prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev;
            } else {
                const updated = [...prev];
                updated[idx] = Math.max(updated[idx] - 1, 1);
                return updated;
            }
        });
    };

    const neuronCountInc = (idx) => {
        setNeuronsInLayers(prev => {
            const updated = [...prev];
            updated[idx] = Math.min(updated[idx] + 1, 6);
            return updated;
        });
    };

    const createModel = async () => {
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: neuronsInLayers[0], inputShape: [1], activation: 'relu' }));
        for (let i = 1; i < hiddenLayers; i++) {
            model.add(tf.layers.dense({ units: neuronsInLayers[i], activation: 'relu' }));
        }
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

        const xs = tf.tensor2d([0, 1, 2, 3, 4, 5], [6, 1]);
        const ys = tf.tensor2d([0, 2, 4, 6, 8, 10], [6, 1]);

        await model.fit(xs, ys, { epochs: epochs });

        alert('Model training complete!');
    };

    return (
        <div className="grid grid-cols-6 gap-4 overflow-hidden">
            <div className="col-span-4 flex justify-center items-center">
                <FCNNComponent architecture={[1, ...neuronsInLayers, 1]} showBias={showBias} showLabels={showLabels} />
            </div>
            <div className="col-span-2 m-4 p-6 bg-gray-100 border border-gray-300">
                <h1 className="text-xl font-bold mb-4">Settings</h1>
                <h2 className="font-bold mb-2">Architecture</h2>
                <IncDecButton labelText={"Hidden layers"} valueText={hiddenLayers} onClickDec={layerCountDec} onClickInc={layerCountInc} />
                <div>
                    {Array.from({ length: hiddenLayers }, (_, idx) => (
                        <IncDecButton key={idx} labelText={`Neurons in layer ${idx + 1}`} valueText={neuronsInLayers[idx]} onClickDec={() => neuronCountDec(idx)} onClickInc={() => neuronCountInc(idx)} />
                    ))}
                </div>
                <h2 className="font-bold mb-2">Hyperparameters</h2>
                <Slider labelText="Epochs" setState={setEpochs} />
                <button
                    onClick={createModel}
                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Train Model
                </button>
            </div>
        </div>
    );
}

export default MLP;

const range = (n) => Array.from({ length: n }, (v, k) => k);
const flatten = (arr) => arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten), []);
const pairWise = (arr) => arr.slice(0, -1).map((e, i) => [e, arr[i + 1]]);
