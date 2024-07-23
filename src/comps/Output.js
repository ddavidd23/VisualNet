export default function Output({probs}) {
    console.log(`Output received ${probs}`);

    return (
        <div className="w-3/4 h-1/2 px-4 py-2 rounded-lg m-auto mb-4">
            {Array(10).fill().map((_, i) => {
                return (
                    <div key={i} className="flex flex-row items-center my-1.5">
                        <div className="shrink-0 w-6 text-sm font-bold text-gray-700">
                            {i}
                        </div>
                        <div className="flex-1 h-4 bg-gray-300 rounded-full overflow-hidden ml-2">
                            <div 
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${probs[i] * 90 + 10}%` }}
                            />
                        </div>
                        <div className="shrink-0 w-12 ml-2 text-sm text-gray-700">
                            {(probs[i] * 100).toFixed(1)}%
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
