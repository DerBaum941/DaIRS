import React from "react"
import { NavLink } from "react-router-dom"
import '../styles/Header.scss'

const Header = () => {
  return (
    <header>
      <div className="">

      </div>

      <div className="NavButtons">
        <NavLink to="/">Home</NavLink>
        <NavLink to="login">Sell Data</NavLink>
        <NavLink to="/stats">Statssssss</NavLink>
      </div>

      <div className="">

      </div>
    </header>
  )
}

export default Header