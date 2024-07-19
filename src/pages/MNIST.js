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
import { MnistData } from '../data/data';

const MAX_IN_LAYER = 256;
const MAX_LAYERS = 4;


function MNIST() {
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    const [epochs, setEpochs] = useState(500);
    const [showBias, setShowBias] = useState(true);
    const [modelFunctionIdx, setModelFunctionIdx] = useState(0);
    const [model, setModel] = useState();
    const [predictions, setPredictions] = useState();
    const [data, setData] = useState();
    const [batchSize, setBatchSize] = useState(128);

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
        model.add(tf.layers.dense({ units: neuronsInLayers[0], inputShape: [784], activation: 'relu' }));
        for (let i = 1; i < hiddenLayers; i++) {
            model.add(tf.layers.dense({ units: neuronsInLayers[i], activation: 'relu' }));
        }
        model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));
        model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
        return model;
    };


    const trainModel = async () => {
        if (!data) {
            alert("Data not loaded yet");
            return;
        }
    
        if (!model) {
            setModel(initializeModel());
        }
    
        const {images: trainDataXs, labels: trainDataLabels} = data.getTrainData();
        console.log(trainDataXs);
        console.log(trainDataLabels);
        model.summary();

        // // Create a dataset from the tensors
        // const trainDataset = tf.data
        //     .zip({xs: tf.data.array(trainDataXs), labels: tf.data.array(trainDataLabels)})
        //     .batch(batchSize);

        await model.fit(trainDataXs, trainDataLabels, {
            epochs: epochs,
            // validationData: testDataset,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
                }
            }
        });
    
        alert('Model training complete!');
    };

    useEffect(() => {
        async function loadData() {
            try {
                console.log("Starting to load data");
                const loader = new MnistData();
                console.log("loading data.");
                await loader.load();
                console.log("finished loading data.");
                setData(loader);  // Set the entire MnistData instance as the data
                console.log("finished setting data.");
            } catch (error) {
                console.error("Error loading MNIST data:", error);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        if (!model || hiddenLayers !== model.layers.length - 2 || 
            !neuronsInLayers.every((neurons, i) => model.layers[i + 1].units === neurons)) {
            setModel(initializeModel());
        }
    }, [hiddenLayers, neuronsInLayers, modelFunctionIdx, batchSize]);

    return (
        <div className="flex flex-col">
            <Header headerText={"MNIST Classification"} />
            <div id="spacer" className="h-4"></div>
            <div className="flex flex-row justify-between">
                <div className="flex-1 m-4 flex justify-center border border-gray-300 h-1/2">
                    <MNISTDiagram architecture={[728, ...neuronsInLayers, 10]} showBias={showBias} />
                </div>
                <div className="m-4 w-1/3">
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

                        <Slider 
                            labelText="Batch Size" 
                            setState={setBatchSize} 
                            min={1} 
                            max={1024} 
                            initial={128}
                        />
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
