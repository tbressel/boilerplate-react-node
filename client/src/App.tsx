/////////////////////////////////////
////////     IMPORTATIONS    ////////
/////////////////////////////////////

// React library
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Routes importation
import Home from './routes/Home';
import Route1 from './routes/Route1';
import Route2 from './routes/Route2';
import Route3 from './routes/Route3';
import Route4 from './routes/Route4';



function App() {
  return (
    <>
      <h2>App.tsx</h2>

<BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/route1" element={<Route1 />} />
        <Route path="/route2" element={<Route2 />} />
        <Route path="/route3" element={<Route3 />} />
        <Route path="/route4" element={<Route4 />} />
      </Routes>
</BrowserRouter>
    </>
  );
}

export default App;
