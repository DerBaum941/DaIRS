import React from 'react'
import { Routes, Route, Navigate, Link} from "react-router-dom";

import Taxes from "./stats/Taxes";
import Commands from './stats/Commands'

const Stats = () => {
  return( 
    <div className='Main'>
      <Link to="/stats">Houm</Link>
      <Link to="/stats/commands">Cmds</Link>
      <Link to="/stats/taxes">txes</Link>
      
      <Routes> 
        <Route path="/commands" element = {<Commands />} />
        <Route path="/taxes" element = {<Taxes />} />
      </Routes>
      STATS HELLO 
    </div>
  )
}

export default Stats