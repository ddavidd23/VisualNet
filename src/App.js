import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from './pages/Layout';
import MLP from './pages/MLP';
import Test from './pages/Test';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Layout />} />
        <Route path='/Test' element={<Test />} />
        <Route path='/MLP' element={<MLP />} />
      </Routes>
    </BrowserRouter>
  )

}

export default App;
