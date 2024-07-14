export const MODEL_FUNCTIONS = [
    (x) => Math.pow(x, 2),
    (x) => Math.sin(2 * Math.PI * x) + Math.cos(3 * Math.PI * x),
    (x) => Math.log(x + 1) * x,
];

export const MODEL_DOMAINS = [
    Array(501).fill().map((_,i) => (i - 250) / 50),
    Array(501).fill().map((_,i) => (i - 250) / 50)
];

