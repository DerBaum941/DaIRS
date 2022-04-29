import React from "react"
import { Link } from "react-router-dom"
import '../styles/Header.scss'

const Header = () => {
  return (
    <header>
      <div className="">

      </div>

      <div className="NavButtons">
        <Link to="/">Home</Link>
        <Link to="login">Sell Data</Link>
        <Link to="/stats">Statssssss</Link>
      </div>

      <div className="">

      </div>
    </header>
  )
}

export default Header