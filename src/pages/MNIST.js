import React, { useEffect, useRef, useState } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as d3 from 'd3';
import Select from "react-select";

import MNISTDiagram from '../comps/MNISTDiagram';
import IncDecButton from '../comps/IncDecButton';
import Slider from '../comps/Slider';
import Graph from '../comps/Graph';
import Header from '../comps/Header';
import FunctionSelect from '../comps/FunctionSelect';

import * as Constants from '../Constants';

const MAX_IN_LAYER = 64
const MAX_LAYERS = 4

function MNIST() {
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    const [epochs, setEpochs] = useState(500);
    const [showBias, setShowBias] = useState(true);
    const [modelFunctionIdx, setModelFunctionIdx] = useState(0);
    const [model, setModel] = useState();
    const [predictions, setPredictions] = useState();

    const layerCountDec = () => {
        setHiddenLayers(prev => (prev > 1 ? prev - 1 : 1));
        setNeuronsInLayers(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    };

    const layerCountInc = () => {
        setHiddenLayers(prev => (prev < MAX_LAYERS ? prev + 1 : MAX_LAYERS));
        setNeuronsInLayers(prev => (prev.length < MAX_LAYERS ? [...prev, 1] : prev));
    };

    const initializeModel = () => {
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: neuronsInLayers[0], inputShape: [1], activation: 'relu' }));
        for (let i = 0; i < hiddenLayers; i++) {
            model.add(tf.layers.dense({ units: neuronsInLayers[i], activation: 'relu' }));
        }
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        return model;
    };

    const trainModel = async () => {
        if (!model) {
            setModel(initializeModel());
        }
    
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
    
        alert('Model training complete!');
    };

    useEffect(() => {
        if (!model || hiddenLayers !== model.layers.length - 2 || 
            !neuronsInLayers.every((neurons, i) => model.layers[i + 1].units === neurons)) {
            setModel(initializeModel());
        }
    }, [hiddenLayers, neuronsInLayers, modelFunctionIdx]);

    return (
        <div className="flex flex-col">
            <Header headerText={"MNIST Classification"}/>
            <div id="spacer" className="h-4"></div>
            <div className="flex flex-row justify-between">
                <div className="flex-1 m-4">
                    <Graph modelFunctionIdx={modelFunctionIdx} predictions={predictions} />
                </div>
                <div className="flex-1 m-4 flex justify-center">
                    <MNISTDiagram architecture={[1, ...neuronsInLayers, 1]} showBias={showBias} />
                </div>
                <div className="flex-1 m-4">
                    <div className="flex flex-col p-6 gap-y-3 bg-gray-100 border border-gray-300">
                        <h1 className="text-xl font-bold">Settings</h1>
                        <IncDecButton labelText={"Hidden layers"} valueText={hiddenLayers} onClickDec={layerCountDec} onClickInc={layerCountInc} />
                        {Array.from({ length: hiddenLayers }, (_, idx) => (
                            <Slider 
                                key={idx} 
                                labelText={`Neurons in layer ${idx + 1}`} 
                                setState={setNeuronsInLayers} 
                                min={1} 
                                max={MAX_IN_LAYER} 
                                initial={neuronsInLayers[idx] || 1}
                                index={idx}
                            />
                        ))}
                        
                        <Slider 
                            labelText="Epochs" 
                            setState={setEpochs} 
                            min={1} 
                            max={2000} 
                            initial={epochs}
                        />
                        <FunctionSelect labelText="Generating function" onChange={setModelFunctionIdx}/>
                        <button
                            onClick={trainModel}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Train Model
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    
    
}

export default MNIST;
