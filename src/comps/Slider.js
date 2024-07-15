import React, { useState } from "react";

export default function Slider({ labelText, setState, min, max, initial, index = null }) {
    const [value, setValue] = useState(initial);

    const handleChange = (e) => {
        const newValue = parseInt(e.target.value);
        setValue(newValue);
        if (index !== null) {
            // For array-based state (neurons in layers)
            setState(prevState => {
                const newState = [...prevState];
                newState[index] = newValue;
                return newState;
            });
        } else {
            // For single-value state (epochs)
            setState(newValue);
        }
    };

    return (
        <>
            <p className="text-sm">{labelText}</p>
            <div className="bg-white rounded-lg px-1 pt-1 -mt-3 w-full border border-gray-300">
                <input 
                    type="range"
                    id="price-range"
                    className="w-full"
                    min={min} max={max}
                    value={value}
                    onChange={handleChange}
                />
                <div className="flex flex-row -mt-2">
                    <span className="flex-1 text-sm text-gray-400 text-left">{min}</span>
                    <span className="flex-1 text-sm text-center">{value}</span>
                    <span className="flex-1 text-sm text-gray-400 text-right">{max}</span>
                </div>
            </div>
        </>
    );
}