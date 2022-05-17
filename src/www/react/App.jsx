import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import './styles/App.scss'
import Footer from './components/Footer';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import Profile from './components/stats/Profile';
import Shilling from './components/Shilling';
import Stats from './components/Stats';

export default () => (
  <div className="App">
    <BrowserRouter>
        <Header />
        <Routes>
          <Route index element = { <Home />} />
          <Route path = "login" element = { <Login /> } />

          {/* Child routes are inside the stats component  */}
          <Route path = "stats/*" element = {<Stats />} /> 

          <Route path = "shilling" element = {<Shilling />} />

          <Route path = "profile/:username" element = {<Profile />} />

          <Route path = "profile" element = {<Profile />} />

          {/* Default route that redirects back to root */}
          <Route path="*" element = {<Navigate to ="/" replace />} />
        </Routes>
        <Footer />
    </BrowserRouter>
  </div>
);
