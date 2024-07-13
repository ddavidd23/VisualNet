import React, { useEffect, useRef, useState } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as d3 from 'd3';

import MLPDiagram from '../comps/MLPDiagram';
import IncDecButton from '../comps/IncDecButton';
import Slider from '../comps/Slider';

const MODEL_FUNCTIONS = [
    (x) => Math.pow(x, 2),
    (x) => Math.sin(2 * Math.PI * x) + Math.cos(3 * Math.PI * x),
    (x) => Math.log(x + 1) * x,
];

const MODEL_DOMAINS = [
    Array(1001).fill().map((_, i) => (i - 500) / 100)
]

const WIDTH = 500;
const HEIGHT = 500;
const MARGIN = { top: 10, right: 10, bottom: 20, left: 30 };
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

function Graph({ modelFunctionIdx, model }) {
    const svgRef = useRef();
    const [evaluation, setEvaluation] = useState([]);

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

        const xVals = MODEL_DOMAINS[modelFunctionIdx]

        const modelData = xVals.map((x) => ({
            x: x,
            y: MODEL_FUNCTIONS[modelFunctionIdx](x)
        }));

        if (model) {
            const xs = tf.tensor2d(xVals, [xVals.length, 1]);
            const ys = model.predict(xs);
            ys.array().then(predictions => {
                const evalData = xVals.map((x, i) => ({
                    x: x,
                    y: predictions[i][0]
                }));
                setEvaluation(evalData);
            });
        }

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

        const evalLine = d3.line()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .curve(d3.curveCardinal);
        g.selectAll(".eval-line")
            .data([evaluation])
            .join("path")
            .attr("class", "eval-line")
            .attr("d", evalLine)
            .attr("fill", "none")
            .attr("stroke", "#3B8255");
    }, [modelFunctionIdx, model, evaluation]);

    return (
        <svg ref={svgRef}></svg>
    );
}

function MLP() {
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    const [epochs, setEpochs] = useState(500);
    const [showBias, setShowBias] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const [modelFunctionIdx, setModelFunctionIdx] = useState(0);
    const [model, setModel] = useState();

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
        console.log(`hidden layers: ${hiddenLayers}`);
        for (let i = 0; i < hiddenLayers; i++) {
            model.add(tf.layers.dense({ units: neuronsInLayers[i], activation: 'relu' }));
        }
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

        const xVals = MODEL_DOMAINS[modelFunctionIdx];

        const yVals = xVals.map(MODEL_FUNCTIONS[modelFunctionIdx]);
        const xs = tf.tensor2d(xVals, [xVals.length, 1]);
        const ys = tf.tensor2d(yVals, [yVals.length, 1]);

        await model.fit(xs, ys, {
            epochs: epochs,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    if(epoch%10 === 0) { 
                        console.log("onEpochEnd" + epoch + JSON.stringify(logs));
                    }
                }
            }
        });
        setModel(model);

        alert('Model training complete!');
    };

    return (
        <div className="flex flex-row">
            <div className="m-4">
                <Graph modelFunctionIdx={modelFunctionIdx} model={model} />
            </div>
            <div className="m-4">
                <MLPDiagram architecture={[1, ...neuronsInLayers, 1]} showBias={showBias} showLabels={showLabels} />
            </div>
            <div className="flex flex-col m-4 ml-auto p-6 bg-gray-100 border border-gray-300 h-2/4 w-full">
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
