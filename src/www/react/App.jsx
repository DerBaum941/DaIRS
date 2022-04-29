import React from "react";
import { BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import Login from "./components/Login";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Stats from "./components/Stats";
import Profile from "./components/stats/Profile"

import './styles/App.scss'

export default () => (
  <div className="App">
    <BrowserRouter>
        <Header />
        <Routes>
          <Route index element = { <Home />} />
          <Route path = "/login" element = { <Login /> } />

          {/* Child routes are inside the stats component  */}
          <Route path = "/stats/*" element = {<Stats />} /> 

          <Route path = "/profile/:username" element = {<Profile />} />

          {/* Default route that redirects back to root */}
          {/* <Route path="*" element = {<Navigate to ="/" replace />} /> */}
        </Routes>
        <Footer />
    </BrowserRouter>
  </div>
);
