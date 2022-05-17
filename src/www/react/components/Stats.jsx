import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";

import '../styles/Stats.scss';
import Commands from './stats/Commands';
import Evaders from './stats/Evaders';
import Redeems from './stats/Redeems';
import StatsHome from './stats/StatsHome';
import Taxes from './stats/Taxes';
import Messages from './stats/Messages';

const Stats = () => {
  return ( 
    <main className="Stats">

      <div className="StatsMain">
        <nav className="StatsMenu">
          {/* <NavLink strict to="/stats">Houm</NavLink> */}
          <NavLink to="/stats/commands">Commands</NavLink>
          <NavLink to="/stats/taxes">Taxes</NavLink>
          <NavLink to="/stats/evaders">Evaders</NavLink>
          <NavLink to="/stats/redeems">Redeems</NavLink>
          <NavLink to="/stats/messages">Messages</NavLink>
        </nav>
        
        <div className="StatsBody">
          <Routes> 
            <Route index element = {<StatsHome /> } />
            <Route path="/commands" element = {<Commands />} />
            <Route path="/taxes" element = {<Taxes />} />
            <Route path="/evaders" element = {<Evaders />} />
            <Route path="/redeems" element = {<Redeems />} />
            <Route path="/messages" element = {<Messages />} />
            <Route path="/*" element = {<Navigate to ="/stats" />} />
          </Routes>
        </div>
      </div>
    </main>
  )
}

export default Stats;