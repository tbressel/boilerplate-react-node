/////////////////////////////////////
////////     IMPORTATIONS    ////////
/////////////////////////////////////

// React library
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Route importation
import Home from './routes/Home';



function App() {
  return (
    <>
      <h2>App.tsx</h2>

<BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
      </Routes>
</BrowserRouter>
    </>
  );
}

export default App;
