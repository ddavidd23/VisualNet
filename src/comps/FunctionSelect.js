import React from "react";
import Select from "react-select";
import MathJax from "react-mathjax2";

const options = [
    { value: 0, label: "$x^2$" },
    { value: 1, label: "$\\sin(2 \\pi x) + \\cos(3 \\pi x)$" },
    { value: 2, label: "$\\log(x + 1) * x$" }
];

function FunctionSelect({ labelText, onChange }) {
    const customSingleValue = ({ data }) => (
        <MathJax.Context input="tex">
            <MathJax.Node inline>{data.label}</MathJax.Node>
        </MathJax.Context>
    );

    const customOption = (props) => (
        <MathJax.Context input="tex">
            <MathJax.Node inline>{props.data.label}</MathJax.Node>
        </MathJax.Context>
    );

    return (
        <div>
            <h2>{labelText}</h2>
            <MathJax.Context input="tex">
                <Select
                    options={options}
                    components={{ SingleValue: customSingleValue, Option: customOption }}
                    onChange={(selectedOption) => onChange(selectedOption.value)}
                />
            </MathJax.Context>
        </div>
    );
}

export default FunctionSelect;
