import React from "react";
import Home from "./components/Home"
import Header from "./components/Header"
import Footer from "./components/Footer";

import './styles/App.scss'

export default () => (
  <div className="App">
    <Header />
    <Home />
    <Footer />
  </div>
);
