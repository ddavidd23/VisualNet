import React, { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as d3 from "d3";


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
            <div class="bg-white rounded-lg px-1 pt-1 w-full">
                <div>
                    <input 
                        type="range"
                        id="price-range"
                        class="w-full"
                        min="0" max="10000"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setState(e.target.value);
                        }}
                    />
                </div>
                <div class="text-center">
                    <span className="text-sm text-center">{value}</span>
                </div>
            </div>
        </>
    );
}

function LinePlot({
    data,
    width = 640,
    height = 400,
    marginTop = 20,
    marginRight = 20,
    marginBottom = 40,  // Increased to make room for x-axis labels
    marginLeft = 40    // Increased to make room for y-axis labels
  }) {
    const x = d3.scaleLinear().domain([0, data.length - 1]).range([marginLeft, width - marginRight]);
    const y = d3.scaleLinear().domain(d3.extent(data)).range([height - marginBottom, marginTop]);
    const line = d3.line()
      .x((d, i) => x(i))
      .y(y);
  
    const xAxis = d3.axisBottom(x).ticks(data.length);
    const yAxis = d3.axisLeft(y).ticks(5);
  
    const svgRef = React.useRef(null);
  
    useEffect(() => {
      const svg = d3.select(svgRef.current);
  
      // Remove previous axes
      svg.selectAll('.x-axis').remove();
      svg.selectAll('.y-axis').remove();
  
      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .attr("class", "x-axis")
        .call(xAxis);
  
      // Add y-axis
      svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .attr("class", "y-axis")
        .call(yAxis);
    }, [data, height, marginBottom, marginLeft, marginRight, marginTop, width, xAxis, yAxis]);
  
    return (
      <svg ref={svgRef} width={width} height={height}>
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d={line(data)} />
        <g fill="white" stroke="currentColor" strokeWidth="1.5">
          {data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d)} r="2.5" />
          ))}
        </g>
      </svg>
    );
  }
  

const MAX_LAYERS = 6;
const MAX_NEURONS = 6;
const X_TRAIN_DATA = [0,1,2,3,4,5];
const Y_TRAIN_DATA = [0,2,4,6,8,10];

function MLP() {
    // Architecture state
    const [hiddenLayers, setHiddenLayers] = useState(1);
    const [neuronsInLayers, setNeuronsInLayers] = useState([1]);
    
    // Hyperparameter state
    const [epochs, setEpochs] = useState(500);

    const layerCountDec = () => {
        setHiddenLayers(prev => (prev>1 ? prev-1 : 1));
        setNeuronsInLayers(prev => (prev.length>1 ? prev.slice(0,-1) : prev));
    };

    const layerCountInc = () => {
        setHiddenLayers(prev => (prev < MAX_LAYERS ? prev+1 : MAX_LAYERS));
        setNeuronsInLayers(prev => (prev.length < MAX_LAYERS ? [...prev, 1] : prev));
    };

    const neuronCountDec = (idx) => {
        setNeuronsInLayers(prev => {
            if(prev[idx] === 1) {
                setHiddenLayers(prevLayers => (prevLayers>1 ? prevLayers-1 : 1));
                return prev.length>1 ? prev.filter((_, i) => i !== idx) : prev;
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
            updated[idx] = Math.min(updated[idx] + 1, MAX_NEURONS);
            return updated;
        });
    };

    const createModel = async () => {
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: neuronsInLayers[0], inputShape: [1], activation: 'relu' }));
        for (let i = 1; i < hiddenLayers; i++) {
            model.add(tf.layers.dense({ units: neuronsInLayers[i], activation: 'relu' }));
        }
        model.add(tf.layers.dense({ units: 1}));
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

        const xs = tf.tensor2d(X_TRAIN_DATA, [X_TRAIN_DATA.length, 1]);
        const ys = tf.tensor2d(Y_TRAIN_DATA, [Y_TRAIN_DATA.length, 1]);

        await model.fit(xs, ys, { epochs: epochs });

        alert('Model training complete!');
    }


    return (
        <>
            <div className="test-gray-900 font-medium">
                <div className="float-right m-4 w-80 p-6 bg-gray-100 border border-gray-300">
                    <h1 className="text-xl font-bold mb-4">Settings</h1>
                    <h2 className="font-bold mb-2">Architecture</h2>
                    <IncDecButton labelText={"Hidden layers"} valueText={hiddenLayers} onClickDec={layerCountDec} onClickInc={layerCountInc}/>
                    <div>
                        {Array.from({length: hiddenLayers}, (_, idx) => (
                            <IncDecButton key={idx} labelText={`Neurons in layer ${idx+1}`} valueText={neuronsInLayers[idx]} onClickDec={() => neuronCountDec(idx)} onClickInc={() => neuronCountInc(idx)} />
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
            <LinePlot data={[1,2,3,4,4]} />
        </>
    );
}

export default MLP;