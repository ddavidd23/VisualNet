import React, { useEffect, useRef, useState } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as d3 from 'd3';

import MLPDiagram from '../comps/MLPDiagram';
import IncDecButton from '../comps/IncDecButton';
import Slider from '../comps/Slider';



const MODEL_FUNCTIONS = [
    (x) => Math.pow(x, 2),
    (x) => Math.sin(2*Math.PI*x) + Math.cos(3*Math.PI*x),
    (x) => Math.log(x+1)*x,
];

const data = [
    { x: 0, y: 0 },
    { x: 0.1, y: 0.2 },
    { x: 0.2, y: 0.1 },
    { x: 0.3, y: 0.2 },
    { x: 0.4, y: 0.1 },
  ];

  const WIDTH        = 400;
  const HEIGHT       = 300;
  const MARGIN       = { top: 10, right: 10, bottom: 20, left: 30 };
  const INNER_WIDTH  = WIDTH - MARGIN.left - MARGIN.right;
  const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

  function Graph() {
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
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.x)])
            .range([0, INNER_WIDTH]);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.y)])
            .range([INNER_HEIGHT, 0]);
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
        const myLine = d3.line()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .curve(d3.curveCardinal);
        g.selectAll(".line")
            .data([data])
            .join("path")
            .attr("class", "line")
            .attr("d", myLine)
            .attr("fill", "none")
            .attr("stroke", "#00bfa6");
    }, [data]);

    return (
        <svg ref={svgRef}></svg>
    )
}

function MLP() {
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    const [epochs, setEpochs] = useState(500);
    const [showBias, setShowBias] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const [modelFunctionIdx, setModelFunctionIdx] = useState(0);

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

        // const xs = tf.tensor2d([0, 1, 2, 3, 4, 5], [6, 1]);
        // const ys = tf.tensor2d([0, 2, 4, 6, 8, 10], [6, 1]);
        if(modelFunctionIdx === 0) {
            var x_vals = Array(101).fill().map((_,i) => (i-50)/10);
        }
        console.log(x_vals);
        const y_vals = x_vals.map(MODEL_FUNCTIONS[modelFunctionIdx]);
        const xs = tf.tensor2d(x_vals, [x_vals.length,1]);
        const ys = tf.tensor2d(y_vals, [y_vals.length,1]);
        console.log(`xs: ${xs}`);
        console.log(`ys: ${ys}`);

        await model.fit(xs, ys, { epochs: epochs });

        alert('Model training complete!');
    };

    return (
        <div className="flex flex-row">
            <div className="m-4">
                <Graph />
            </div>
            <div className="m-4">
                <MLPDiagram architecture={[1, ...neuronsInLayers, 1]} showBias={showBias} showLabels={showLabels} />
            </div>
            <div className="flex flex-col m-4 ml-auto p-6 bg-gray-100 border border-gray-300 h-2/4">
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
