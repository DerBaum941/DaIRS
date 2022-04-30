import React from 'react';
import { Routes, Route, Link, Navigate } from "react-router-dom";

import StatsHome from './stats/StatsHome';
import Taxes from "./stats/Taxes";
import Commands from "./stats/Commands";
import Redeems from "./stats/Redeems";

const Stats = () => {
  return( 
    <main className="Stats">

      <nav className = "StatsMenu">
        <Link to="/stats">Houm</Link>
        <Link to="/stats/commands">Cmds</Link>
        <Link to="/stats/taxes">txes</Link>
        <Link to="/stats/redeems">redeems</Link>
      </nav>
      
      <div>
        <Routes> 
          <Route index element = {<StatsHome /> } />
          <Route path="/commands" element = {<Commands />} />
          <Route path="/taxes" element = {<Taxes />} />
          <Route path="/redeems" element = {<Redeems />} />
          <Route path="/*" element = {<Navigate to ="/stats" />} />
        </Routes>
      </div>
    </main>
  )
}

export default Stats