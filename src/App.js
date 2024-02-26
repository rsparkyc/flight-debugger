import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import ActiveFlights from "./components/ActiveFlights";
import React from "react";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/portal/admin/flight-debugger/" element={<ActiveFlights />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
