import React, { useState } from 'react';

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

const MAX_LAYERS = 6;
const MAX_NEURONS = 6;

function MLP() {
    const [hiddenLayers, setHiddenLayers] = useState(0);
    const [neuronsInLayers, setNeuronsInLayers] = useState([]);

    const layerCountDec = () => {
        setHiddenLayers(prev => (prev>0 ? prev-1 : 0));
        setNeuronsInLayers(prev => (prev.length>0 ? prev.slice(0,-1) : []));
    };

    const layerCountInc = () => {
        setHiddenLayers(prev => (prev < MAX_LAYERS ? prev+1 : MAX_LAYERS));
        setNeuronsInLayers(prev => (prev.length < MAX_LAYERS ? [...prev, 0] : prev));
    };

    const neuronCountDec = (idx) => {
        setNeuronsInLayers(prev => {
            const updated = [...prev];
            updated[idx] = Math.max(updated[idx] - 1, 0);
            return updated;
        });
    };

    const neuronCountInc = (idx) => {
        setNeuronsInLayers(prev => {
            const updated = [...prev];
            updated[idx] = Math.min(updated[idx] + 1, MAX_NEURONS);
            return updated;
        });
    };


    return (
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
            </div>
        </div>
    );
}

export default MLP;