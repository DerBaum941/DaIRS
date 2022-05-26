import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";

import '../styles/Stats.scss';

import StatsHome from './stats/StatsHome';
import StatsPage from "./stats/StatsPage";

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
            <Route path="/commands" element = {<StatsPage key={1} columns={4} endpoint={'commands'}/>} />
            <Route path="/taxes" element = {<StatsPage key={2} columns={3} endpoint={'streak'}/>} />
            <Route path="/evaders" element = {<StatsPage key={3} columns={3} endpoint={'evaders'} />} />
            <Route path="/redeems" element = {<StatsPage key={4} columns={2} endpoint={'redeems'} /> } />
            <Route path="/messages" element = {<StatsPage key={5} columns={2} endpoint={'message'} />} />
            <Route path="/*" element = {<Navigate to ="/stats" />} />
          </Routes>
        </div>
      </div>
    </main>
  )
}

export default Stats;