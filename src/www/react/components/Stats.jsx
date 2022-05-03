import React from 'react';
import { Routes, Route, NavLink, Navigate } from "react-router-dom";

import StatsHome from './stats/StatsHome';
import Taxes from "./stats/Taxes";
import Commands from "./stats/Commands";
import Redeems from "./stats/Redeems";
import Evaders from './stats/Evaders';
import "../styles/Stats.scss";
import Commands2 from './stats/Commands2';

const Stats = () => {
  return( 
    <main className="Stats">

      <div className="StatsMain">
        <nav className="StatsMenu">
          {/* <NavLink strict to="/stats">Houm</NavLink> */}
          <NavLink to="/stats/commands">Commands</NavLink>
          <NavLink to="/stats/taxes">Taxes</NavLink>
          <NavLink to="/stats/redeems">Redeems</NavLink>
          <NavLink to="/stats/evaders">Evaders</NavLink>
          <NavLink to="/stats/test">Test</NavLink>
        </nav>
        
        <div className="StatsBody">
          <Routes> 
            <Route index element = {<StatsHome /> } />
            <Route path="/commands" element = {<Commands />} />
            <Route path="/taxes" element = {<Taxes />} />
            <Route path="/redeems" element = {<Redeems />} />
            <Route path="/evaders" element = {<Evaders />} />
            <Route path="/test" element = {<Commands2 />} />
            <Route path="/*" element = {<Navigate to ="/stats" />} />
          </Routes>
        </div>
      </div>
    </main>
  )
}

export default Stats