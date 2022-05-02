import React from 'react';
import { Routes, Route, NavLink, Navigate } from "react-router-dom";

import StatsHome from './stats/StatsHome';
import Taxes from "./stats/Taxes";
import Commands from "./stats/Commands";
import Redeems from "./stats/Redeems";
import "../styles/Stats.scss"

const Stats = () => {
  return( 
    <main className="Stats">

      <div className="StatsMain">
        <nav className="StatsMenu">
          {/* <NavLink strict to="/stats">Houm</NavLink> */}
          <NavLink to="/stats/commands">Cmds</NavLink>
          <NavLink to="/stats/taxes">txes</NavLink>
          <NavLink to="/stats/redeems">redeems</NavLink>
        </nav>
        
        <div className="StatsBody">
          <Routes> 
            <Route index element = {<StatsHome /> } />
            <Route path="/commands" element = {<Commands />} />
            <Route path="/taxes" element = {<Taxes />} />
            <Route path="/redeems" element = {<Redeems />} />
            <Route path="/*" element = {<Navigate to ="/stats" />} />
          </Routes>
        </div>
      </div>
    </main>
  )
}

export default Stats