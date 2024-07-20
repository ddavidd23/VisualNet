import React, { useEffect, useRef, useState } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import mnist from "mnist";

import MNISTDiagram from '../comps/MNISTDiagram';
import IncDecButton from '../comps/IncDecButton';
import Slider from '../comps/Slider';
import Header from '../comps/Header';
import FunctionSelect from '../comps/FunctionSelect';

import * as Constants from '../Constants';
import { gray } from 'd3';

const MAX_IN_LAYER = 32;
const MAX_LAYERS = 4;
const BATCH_SIZE_CHOICES = [8,16,32,64,128];
const NUM_TRAIN_ELEMENTS = 4000;
const NUM_TEST_ELEMENTS = 500;
const LABEL_LENGTH = 10;
const FLATTENED_IMAGE_LENGTH = 784;


function MNIST() {
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    const [epochs, setEpochs] = useState(500);
    const [showBias, setShowBias] = useState(true);
    const [modelFunctionIdx, setModelFunctionIdx] = useState(0);
    const [model, setModel] = useState();
    const [modelTrained, setModelTrained] = useState(false);
    const [predictions, setPredictions] = useState();
    const [data, setData] = useState();
    const [batchSize, setBatchSize] = useState(128);
    const [canvasContext, setCanvasContext] = useState();
    const [isDrawing, setIsDrawing] = useState(false);
    const [mousePosition, setMousePosition] = useState({});
    const [epochInfo, setEpochInfo] = useState([]);

    const canvasRef = useRef();  // replacement for document.getElementById("canvas").getContext("2d");
    const logRef = useRef();

    const clear = () => {
        if (canvasContext) {
            canvasContext.fillStyle = "white";
            canvasContext.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }

    const startDrawing = (e) => {
        console.log("started drawing");
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }

    const stopDrawing = (e) => {
        console.log("stopped drawing");
        setIsDrawing(false);
    }

    const draw = (e) => {
        if(!isDrawing) {
            return;
        }
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log(`x: ${x}, y: ${y}`);
        
        const context = canvasContext;
        context.strokeStyle = "black";
        context.lineWidth = 4;
        context.lineCap = "round";
    
        context.beginPath();
        context.moveTo(mousePosition.x, mousePosition.y);
        context.lineTo(x, y);
        context.stroke();
    
        setMousePosition({ x, y });
    }

    useEffect(() => {   // useEffect to make sure getContext is not called with every re-render (even though MDN says it's fine usually)
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        setCanvasContext(context);
    }, []);
    
    useEffect(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }, [epochInfo]); // Dependency on epochInfo to trigger scroll update on change
      

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
        model.add(tf.layers.dense({ units: neuronsInLayers[0], inputShape: [FLATTENED_IMAGE_LENGTH], activation: 'relu' }));
        for (let i = 1; i < hiddenLayers; i++) {
            model.add(tf.layers.dense({ units: neuronsInLayers[i], activation: 'relu' }));
        }
        model.add(tf.layers.dense({ units: LABEL_LENGTH, activation: 'softmax' }));
        model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
        return model;
    };

    const trainModel = async () => {
        if (!data) {
            alert("Data not loaded yet");
            return;
        }
        if (!model) {
            setModelTrained(false);
            setModel(initializeModel());
        }
        
        setEpochInfo([]);
        // const {images: trainDataXs, labels: trainDataLabels} = data.getTrainData();
        // console.log(trainDataXs);
        const trainData = data.training;
        const testData = data.test;
        console.log(`length: ${trainData.length}`);

        const trainDataXs = trainData.reduce((acc, item) => {
            return acc.concat(item.input);
        }, []);
        const trainDataXsTensor = tf.tensor2d(trainDataXs, [NUM_TRAIN_ELEMENTS, FLATTENED_IMAGE_LENGTH]);
        const trainDataLabels = trainData.reduce((acc, item) => {
            return acc.concat(item.output);
        }, []);
        const trainDataLabelsTensor = tf.tensor2d(trainDataLabels, [NUM_TRAIN_ELEMENTS, LABEL_LENGTH]);
        console.log(trainDataLabelsTensor);

        const testDataXs = testData.reduce((acc, item) => {
            return acc.concat(item.input);
        }, []);
        const testDataXsTensor = tf.tensor2d(testDataXs, [NUM_TEST_ELEMENTS, FLATTENED_IMAGE_LENGTH]);
        const testDataLabels = testData.reduce((acc, item) => {
            return acc.concat(item.output);
        }, []);
        const testDataLabelsTensor = tf.tensor2d(testDataLabels, [NUM_TEST_ELEMENTS, LABEL_LENGTH]);
        console.log(testDataLabelsTensor);

        const container = {
            name: "Model Training", tab: "Model", styles: { height: "90%" }
        };
        const metrics = ["loss", "val_loss", "acc", "val_acc"];
        const callbacks = tfvis.show.fitCallbacks(container, metrics);
        await model.fit(trainDataXsTensor, trainDataLabelsTensor, {
            validationData: [testDataXsTensor, testDataLabelsTensor],
            batchSize: batchSize,
            epochs: epochs,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    setEpochInfo(oldEpochInfo => [...oldEpochInfo, { epoch: epoch + 1, loss: logs.loss, accuracy: logs.acc }]);
                }
            }
        });
        setModel(model);
        setModelTrained(true);
        alert('Model training complete!');
    };

    const predict = async() => {
        mnist.draw(data.training[7].input, canvasContext);

        const tensor = tf.browser.fromPixels(canvasRef.current)  // Use canvasRef.current instead of canvasContext
            .resizeNearestNeighbor([28, 28])  // Resize to match MNIST input size
            .mean(2)                          // Convert to grayscale by averaging over color channels
            .expandDims()                     // Add a batch dimension
            .toFloat()                        // Convert to float
            .div(255.0)                       // Normalize to [0, 1]
            .reshape([1, 784]);               // Flatten the image to a vector        console.log(tensor.shape); 
        
        const predictions = await model.predict(tensor).data();
        console.log(`predictions: ${predictions}`);
    }

    useEffect(() => {
        const set = mnist.set(NUM_TRAIN_ELEMENTS, NUM_TEST_ELEMENTS);
        console.log(`0: ${mnist[0].get(100)}`)
        console.log("Finished loading data.")
        setData(set);
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
            <div className="flex flex-row justify-between">
                <div className="flex flex-col">
                    <div className="flex-1 flex flex-col justify-center border border-gray-300 m-4">
                        <MNISTDiagram architecture={[728, ...neuronsInLayers, 10]} showBias={showBias} />
                    </div>
                    <div className="mb-8">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseEnter={stopDrawing}
                            onMouseLeave={stopDrawing}
                            width="28"
                            height="28"
                            className="border border-gray-300 m-4"
                        />
                        <div className="flex flex-row">
                            <button
                                onClick={clear}
                                className="border border-gray-300 ml-4 p-2"
                            >
                                Clear
                            </button>
                            <button
                                onClick={predict}
                                className="border border-gray-300 ml-4 p-2"
                            >
                                Predict
                            </button>
                        </div>
                    </div>
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

                        {/* <Slider 
                            labelText="Batch Size" 
                            setState={setBatchSize} 
                            min={1} 
                            max={1024} 
                            initial={128}
                        /> */}

                        <p className="text-sm">Batch size</p>
                        <div className="flex flex-row">
                            {BATCH_SIZE_CHOICES.map((i) => {
                                return <button key={i} className="flex-1 border border-gray-400 py-1 px-2" onClick={() => setBatchSize(i)}>{i}</button>;
                            })}
                            {/* <button className="flex-1 border border-gray-400 py-1 px-2" onClick={() => setBatchSize(8)}>8</button>
                            <button className="flex-1 border border-gray-400 py-1 px-2" onClick={() => setBatchSize(16)}>16</button> 
                            <button className="flex-1 border border-gray-400 py-1 px-2" onClick={() => setBatchSize(32)}>32</button> 
                            <button className="flex-1 border border-gray-400 py-1 px-2" onClick={() => setBatchSize(64)}>64</button> 
                            <button className="flex-1 border border-gray-400 py-1 px-2" onClick={() => setBatchSize(128)}>128</button>  */}
                        </div>
                        <button
                            onClick={trainModel}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Train Model
                        </button>
                    </div>
                    <div ref={logRef} className="overflow-auto max-h-40 font-mono mt-4">
                        {epochInfo.map(info => (
                            <p key={info.epoch}>Epoch {info.epoch}: Loss: {info.loss.toFixed(4)}, Accuracy: {info.accuracy.toFixed(4)}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MNIST;
