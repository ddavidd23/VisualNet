import React, { useEffect, useRef, useState } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as d3 from 'd3';
import Select from "react-select";

import MLPDiagram from '../comps/MLPDiagram';
import IncDecButton from '../comps/IncDecButton';
import Slider from '../comps/Slider';
import Graph from '../comps/Graph';
import Header from '../comps/Header';

import * as Constants from '../Constants';

const options = [
    { value: 0, label: "test1" },
    { value: 1, label: "test2" },
    { value: 2, label: "test3" }
]

function FunctionSelect({ labelText, onChange }) {
    return (
        <div>
            <h2>{labelText}</h2>
            <Select 
                options={options} 
                onChange={(e) => onChange(e.value)}
            />
        </div>
    )
}

function MLP() {
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    const [epochs, setEpochs] = useState(500);
    const [showBias, setShowBias] = useState(false);
    const [modelFunctionIdx, setModelFunctionIdx] = useState(0);
    const [model, setModel] = useState();
    const [predictions, setPredictions] = useState();

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

        const xVals = Constants.MODEL_DOMAINS[modelFunctionIdx];

        const yVals = xVals.map(Constants.MODEL_FUNCTIONS[modelFunctionIdx]);
        const xs = tf.tensor2d(xVals, [xVals.length, 1]);
        const ys = tf.tensor2d(yVals, [yVals.length, 1]);

        await model.fit(xs, ys, {
            epochs: epochs,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    const yPred = model.predict(xs);
                    yPred.array().then(y => {
                        const predObj = xVals.map((x, i) => ({
                            x: x,
                            y: y[i][0]
                        }));
                        setPredictions(predObj);
                    });
                    console.log("onEpochEnd" + epoch + JSON.stringify(logs));
                }
            }
        });
        setModel(model);

        alert('Model training complete!');
    };

    useEffect(() => {
        console.log(`modelFunctionIdx: ${modelFunctionIdx}`);
    }, [modelFunctionIdx]);

    return (
        <div className="flex flex-col">
            <Header />
            <div id="spacer" className="h-4"></div>
            <div className="flex flex-row justify-between">
                <div className="flex-1 m-4">
                    <Graph modelFunctionIdx={modelFunctionIdx} predictions={predictions} />
                </div>
                <div className="flex-1 m-4">
                    <MLPDiagram architecture={[1, ...neuronsInLayers, 1]} showBias={showBias} />
                </div>
                <div className="flex-1 m-4">
                    <div className="flex flex-col p-6 bg-gray-100 border border-gray-300">
                        <h1 className="text-xl font-bold mb-4">Settings</h1>
                        <IncDecButton labelText={"Hidden layers"} valueText={hiddenLayers} onClickDec={layerCountDec} onClickInc={layerCountInc} />
                        <div>
                            {Array.from({ length: hiddenLayers }, (_, idx) => (
                                <IncDecButton key={idx} labelText={`Neurons in layer ${idx + 1}`} valueText={neuronsInLayers[idx]} onClickDec={() => neuronCountDec(idx)} onClickInc={() => neuronCountInc(idx)} />
                            ))}
                        </div>
                        <Slider labelText="Epochs" setState={setEpochs} />
                        <FunctionSelect labelText="Generating function" onChange={setModelFunctionIdx}/>
                        <button
                            onClick={createModel}
                            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Train Model
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    
    
}

export default MLP;
