import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import ActiveFlights from "./components/ActiveFlights";
import FlightHistory from "./components/FlightHistory";
import React from "react";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/flight-debugger/" element={<ActiveFlights />} />
        <Route path="/flight-debugger/flight-history/:flightId" element={<FlightHistory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
