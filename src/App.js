import './App.css';
import * as tf from '@tensorflow/tfjs';
import { useState, useEffect } from 'react';

async function trainModel(trainData, numNeurons, epochs) {
  const [xData, yData] = trainData;
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [1], units: parseInt(numNeurons), activation: 'relu', useBias: false}));
  model.add(tf.layers.dense({units: 1, useBias: false}));
  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });
  const x = tf.tensor1d(xData);
  const y = tf.tensor1d(yData);
  await model.fit(x, y, { 
    epochs: epochs,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if(epoch%100 === 0) {
          console.log(`Epoch: ${epoch}, loss: ${logs.loss}`);
        }
      }
    }});
  console.log('model trained');
  return model;
}

function App() {
  const [trainDataX, setTrainDataX] = useState('');
  const [trainDataY, setTrainDataY] = useState('');
  const [numNeuronsInput, setNumNeuronsInput] = useState(2);
  const [numNeurons, setNumNeurons] = useState(2);
  const [epochsInput, setEpochsInput] = useState(100);
  const [epochs, setEpochs] = useState(100);
  const [testDataInput, setTestDataInput] = useState('');
  const [testData, setTestData] = useState(null);
  const [trainData, setTrainData] = useState(null);
  const [model, setModel] = useState(null);
  const [output, setOutput] = useState(null);

  const handleChange = (setter) => (e) => {
    setter(e.target.value);
  }

  const handleTrainData = (e) => {
    e.preventDefault();
    const arrayX = trainDataX.split(',').map((item) => parseFloat(item.trim()));
    const arrayY = trainDataY.split(',').map((item) => parseFloat(item.trim()));
    setTrainData([arrayX, arrayY]);
    setNumNeurons(numNeuronsInput);
    setEpochs(epochsInput);
  };

  const handleTestData = (e) => {
    e.preventDefault();
    const arrayTest = testDataInput.split(',').map((item) => parseFloat(item.trim()));
    setTestData(arrayTest);
  };

  useEffect(() => {
    if (trainData) {
      async function loadModel() {
        const loadedModel = await trainModel(trainData, numNeurons, epochs);
        setModel(loadedModel);
      }
      loadModel();
    }
  }, [trainData, numNeurons, epochs]);

  useEffect(() => {
    if (testData && model) {
      async function predict() {
        const output = model.predict(tf.tensor1d(testData));
        const outputData = output.dataSync();
        setOutput(outputData.map(value => value.toFixed(4))); // Format to 4 decimal points
      }
      predict();
    }
  }, [testData, model]);

  return (
    <div>
      <h1>Linear regression model</h1>
      <h2>Architecture</h2>
      <label>
        Neurons:
        <input
          type="number"
          value={numNeuronsInput}
          onChange={handleChange(setNumNeuronsInput)}
          placeholder="Enter number of neurons"
        />
      </label>
      <label>
        Epochs:
        <input
          type="number"
          value={epochsInput}
          onChange={handleChange(setEpochsInput)}
          placeholder="Enter epochs"
        />
      </label>

      <form onSubmit={handleTrainData}>
        <input
          type="text"
          value={trainDataX}
          onChange={handleChange(setTrainDataX)}
          placeholder="Enter X data..."
        />
        <input
          type="text"
          value={trainDataY}
          onChange={handleChange(setTrainDataY)}
          placeholder="Enter Y data..."
        />
        <button type="submit">Train</button>
      </form>

      <form onSubmit={handleTestData}>
        <input
          type="text"
          value={testDataInput}
          onChange={handleChange(setTestDataInput)}
          placeholder="Enter test set..."
        />
        <button type="submit">Predict</button>
      </form>
      {output && <p>Output: {output.join(', ')}</p>}
    </div>
  );
}

export default App;
