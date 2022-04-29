import React from "react"
import { Link } from "react-router-dom"
import '../styles/Header.scss'

const Header = () => {
  return (
    <div className="Header">
      <Link to="/">Home</Link>
      <Link to="login">Sell Data</Link>
      {/* <Link to="/taxes">Who's the most taxy</Link> */}
      <Link to="/stats">Statssssss</Link>
    </div>
  )
}

export default Header