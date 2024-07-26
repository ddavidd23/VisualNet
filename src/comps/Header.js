import React from "react";
import { Link } from 'react-router-dom';

export default function Header({ headerText }) {
    return (
        <nav className="flex items-center justify-between bg-blue-500 p-6">
            <div className="flex-1 text-md text-white">
                <Link to="/" className="block lg:inline-block lg:mt-0 hover:font-bold">
                    Home
                </Link>
            </div>
            <div className="flex-1 text-center text-white">
                <h2>{ headerText }</h2>
            </div>
            <div className="flex-1 text-md text-white text-right">
                {/* <button className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-blue-500 hover:bg-white hover:font-bold">
                    Download Model
                </button> */}
            </div>
        </nav>
    );
}
