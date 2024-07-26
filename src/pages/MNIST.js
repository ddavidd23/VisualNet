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
import Output from '../comps/Output';

const MAX_IN_LAYER = 32;
const MAX_LAYERS = 4;
const BATCH_SIZE_CHOICES = [16,32,64,128];
const NUM_TRAIN_ELEMENTS = 5000;
const NUM_TEST_ELEMENTS = 500;
const LABEL_LENGTH = 10;
const FLATTENED_IMAGE_LENGTH = 784;
const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = CANVAS_WIDTH;
const MAX_EPOCHS = 100;

function MNIST() {
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    const [epochs, setEpochs] = useState(10);
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
    const [probs, setProbs] = useState(Array(10).fill(0.1));

    const canvasRef = useRef();  // replacement for document.getElementById("canvas").getContext("2d");
    const logRef = useRef();
    const mnistParent = useRef();

    const clear = () => {
        if (canvasContext) {
            canvasContext.fillStyle = "white";
            canvasContext.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }

    const startDrawing = (e) => {
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }

    const stopDrawing = (e) => {
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
        context.lineWidth = 16;
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

        const trainData = data.training;
        const testData = data.test;

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

        await model.fit(trainDataXsTensor, trainDataLabelsTensor, {
            validationData: [testDataXsTensor, testDataLabelsTensor],
            batchSize: batchSize,
            epochs: epochs,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(logs);
                    setEpochInfo(oldEpochInfo => [...oldEpochInfo, { epoch: epoch + 1, loss: logs.loss, acc: logs.acc, val_acc: logs.val_acc }]);
                }
            }
        });
        setModel(model);
        setModelTrained(true);
        alert('Model training complete!');
    };

    const predict = async() => {
        const tensor = tf.sub(
            tf.scalar(1),
            tf.browser.fromPixels(canvasRef.current)  // Use canvasRef.current instead of canvasContext
                .resizeNearestNeighbor([28, 28])  // Resize to match MNIST input size
                .mean(2)                          // Convert to grayscale by averaging over color channels
                .expandDims()                     // Add a batch dimension
                .toFloat()                        // Convert to float
                .div(255.0)                       // Normalize to [0, 1]
                .reshape([1, FLATTENED_IMAGE_LENGTH])
        );
        const predictions = await model.predict(tensor).data();
        setProbs(predictions);
        console.log(`predictions: ${predictions}`);
    }

    useEffect(() => {
        const set = mnist.set(NUM_TRAIN_ELEMENTS, NUM_TEST_ELEMENTS);
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
        <div className="flex flex-col bg-gray-50">
            <Header headerText={"MNIST Classification"} />
            <div className="flex flex-row w-full">
                {/* <div className="flex flex-col min-w-0"> */}
                <div ref={mnistParent} className="w-1/3 flex flex-col border border-gray-300 m-4 rounded-lg bg-white">
                    <MNISTDiagram architecture={[FLATTENED_IMAGE_LENGTH, ...neuronsInLayers, LABEL_LENGTH]} showBias={showBias} parentRef={mnistParent} />
                </div>
                <div className="flex-1 flex flex-col bg-white rounded-lg my-4 border border-gray-300">
                    <div className="m-auto">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseEnter={stopDrawing}
                            onMouseLeave={stopDrawing}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
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
                    <Output probs={probs} />
                </div>
                <div className="flex-1 m-4">
                    <div className="flex flex-col p-6 gap-y-3 bg-white border border-gray-300 rounded-lg">
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
                            max={MAX_EPOCHS} 
                            initial={epochs}
                        />

                        <p className="text-sm">Batch size</p>
                        <div className="flex flex-row">
                            {BATCH_SIZE_CHOICES.map((i) => {
                                return <button key={i} className="flex-1 border border-gray-400 py-1 px-2 active:bg-blue-400 focus:bg-blue-400" onClick={() => setBatchSize(i)}>{i}</button>;
                            })}
                        </div>
                        <button
                            onClick={async () => {
                                setEpochInfo([{state: "Initializing training (May take up to 45s)..."}, {state: "If 'Page unresponsive' warning appears, please press 'Wait'. Training will begin shortly afterward."}]);
                                await new Promise(resolve => setTimeout(resolve, 0)); // Ensures state update before continuing
                                trainModel();
                            }}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Train Model
                        </button>
                    </div>
                    <div ref={logRef} className="overflow-auto h-60 font-mono border border-gray-400 rounded-lg m-4">
                        <p className="text-sm font-mono font-bold p-2 m-2">Console</p>
                        {epochInfo.map(info => (
                            "epoch" in info ?
                                <p className="m-2" key={info.epoch}>Epoch {info.epoch}: Loss: {info.loss}, Acc: {info.acc}, Val acc: {info.val_acc}</p> :
                                <p className="m-2" key="0">{info.state}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MNIST;
