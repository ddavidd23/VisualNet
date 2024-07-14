import * as d3 from "d3";

export const MODEL_FUNCTIONS = [
    (x) => Math.pow(x, 2),
    (x) => Math.sin(2 * Math.PI * x) + Math.cos(3 * Math.PI * x),
    (x) => Math.log(x + 1) * x,
];

export const MODEL_DOMAINS = [
    Array(401).fill().map((_,i) => (i - 200) / 50),
    Array(501).fill().map((_,i) => (i - 250) / 250)
];

// export const GRAPH_SCALES = (innerWidth) [
//     {
//         d3.scaleLinear().domain([-4, 4]).range([0, innerWidth]);
//     }
// ]