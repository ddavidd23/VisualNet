import React from "react";
import Select from "react-select";

const options = [
    { value: 0, label: "x^2" },
    { value: 1, label: "sin(2pi x) + cos(3pi x)" },
    { value: 2, label: "x log(x + 1)" }
]

export default function FunctionSelect({ labelText, onChange }) {
    return (
        <div>
            <p className="text-sm">{labelText}</p>
            <Select 
                options={options}
                placeholder="x^2"
                onChange={(e) => onChange(e.value)}
            />
        </div>
    )
}