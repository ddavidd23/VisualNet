import React, { useState } from "react";

export default function Slider({ labelText, setState }) {
    const [value, setValue] = useState(500);

    return (
        <>
            <p className="text-sm">{labelText}</p>
            <div className="bg-white rounded-lg px-1 pt-1 w-full border border-gray-300">
                <div>
                    <input 
                        type="range"
                        id="price-range"
                        className="w-full"
                        min="0" max="10000"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setState(e.target.value);
                        }}
                    />
                </div>
                <div className="text-center">
                    <span className="text-sm text-center">{value}</span>
                </div>
            </div>
        </>
    );
}