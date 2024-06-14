import './App.css';
import * as tf from '@tensorflow/tfjs';
import { useState, useEffect } from 'react';

async function trainModel(trainData) {
  const [xData, yData] = trainData;
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [1], units: 1 }));
  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });
  const x = tf.tensor1d(xData);
  const y = tf.tensor1d(yData);
  await model.fit(x, y, { epochs: 1000 });
  console.log('model trained');
  return model;
}

function App() {
  const [trainDataX, setTrainDataX] = useState('');
  const [trainDataY, setTrainDataY] = useState('');
  const [testDataInput, setTestDataInput] = useState('');
  const [testData, setTestData] = useState(null);
  const [trainData, setTrainData] = useState(null);
  const [model, setModel] = useState(null);
  const [output, setOutput] = useState(null);

  const handleTrainDataXChange = (e) => {
    setTrainDataX(e.target.value);
  };

  const handleTrainDataYChange = (e) => {
    setTrainDataY(e.target.value);
  };

  const handleTestDataChange = (e) => {
    setTestDataInput(e.target.value);
  };

  const handleTrainData = (e) => {
    e.preventDefault();
    const arrayX = trainDataX.split(',').map((item) => parseFloat(item.trim()));
    const arrayY = trainDataY.split(',').map((item) => parseFloat(item.trim()));
    setTrainData([arrayX, arrayY]);
  };

  const handleTestData = (e) => {
    e.preventDefault();
    const arrayTest = testDataInput.split(',').map((item) => parseFloat(item.trim()));
    setTestData(arrayTest);
  };

  useEffect(() => {
    if (trainData) {
      async function loadModel() {
        const loadedModel = await trainModel(trainData);
        setModel(loadedModel);
      }
      loadModel();
    }
  }, [trainData]);

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
      <form onSubmit={handleTrainData}>
        <input
          type="text"
          value={trainDataX}
          onChange={handleTrainDataXChange}
          placeholder="Enter X data..."
        />
        <input
          type="text"
          value={trainDataY}
          onChange={handleTrainDataYChange}
          placeholder="Enter Y data..."
        />
        <button type="submit">Train</button>
      </form>

      <form onSubmit={handleTestData}>
        <input
          type="text"
          value={testDataInput}
          onChange={handleTestDataChange}
          placeholder="Enter test set..."
        />
        <button type="submit">Predict</button>
      </form>
      {output && <p>Output: {output.join(', ')}</p>}
    </div>
  );
}

export default App;
