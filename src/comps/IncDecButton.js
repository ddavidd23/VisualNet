import React from "react";

export default function IncDecButton({ labelText, valueText, onClickDec, onClickInc }) {
    return (
        <form>
            <label className="block text-sm">{labelText}</label>
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
