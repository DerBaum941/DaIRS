import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home"
import Header from "./components/Header"
import Footer from "./components/Footer";

import './styles/App.scss'

export default () => (
  <div className="App">
    <BrowserRouter>
      <Routes>
        <Header />
        <Route index element = {<Home />} />
        <Route path="user" render = {(props)}element = {<UserPage {...props}/>} />
        <Footer />
      </Routes>
    </BrowserRouter>
  </div>
);
