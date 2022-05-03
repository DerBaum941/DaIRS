import React from "react"
import { NavLink, Link } from "react-router-dom"

import Carrd  from "../assets/Carrd.png"
import Tiktok from "../assets/Tiktok.png"
import Twitch from "../assets/Twitch.png"
import Twitter from "../assets/Twitter.png"

import '../styles/Header.scss'

const Header = () => {
  return (
    <header>
      <div className="NavHome">
        DaIRS
      </div>

      <div className="NavButtons">
        <NavLink to="/">Home</NavLink>
        <NavLink to="login">Sell Data</NavLink>
        <NavLink to="stats">Statssssss</NavLink>
      </div>

      <div className="NavSocials">
        <a target="_blank" href="https://daishuquee.carrd.co">
          <img src={Carrd} alt="Carrd.png" />
        </a>
        <a target="_blank" href="https://www.tiktok.com/@daishutv">
          <img src={Tiktok} alt="Carrd.png" />
        </a>
        <a target="_blank" href="https://www.twitch.tv/daishuTV">
          <img src={Twitch} alt="Carrd.png" />
        </a>
        <a target="_blank" href="https://twitter.com/daishuquee">
          <img src={Twitter} alt="Carrd.png" />
        </a>
      </div>
    </header>
  )
}

export default Header