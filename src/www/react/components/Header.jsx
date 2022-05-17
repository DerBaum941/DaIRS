import React from "react";
import { NavLink } from "react-router-dom";

import '../styles/Header.scss';
import Carrd  from '../assets/Carrd.png';
import Tiktok from '../assets/Tiktok.png';
import Twitch from '../assets/Twitch.png';
import Twitter from '../assets/Twitter.png';

const Header = () => {
  return (
    <header>
      <div className="NavHome">
        <NavLink to="/">DaIRS</NavLink>
      </div>

      <div className="NavButtons">
        <NavLink to="/">Home</NavLink>
        {/* <NavLink to="login">Sell Data</NavLink> */}
        <NavLink to="stats">Stats</NavLink>
        {/* Add a component that advertises all of her socials too */}
        <NavLink to="/shilling">Shilling</NavLink>
        <NavLink to="/profile">Search</NavLink>
      </div>

      <div className="NavSocials">
        <a target="_blank" href="https://daishuquee.carrd.co">
          <img src={Carrd} alt="Carrd.png" />
        </a>
        <a target="_blank" href="https://www.tiktok.com/@daishutv">
          <img src={Tiktok} alt="Tiktok.png" />
        </a>
        <a target="_blank" href="https://www.twitch.tv/daishuTV">
          <img src={Twitch} alt="Twitch.png" />
        </a>
        <a target="_blank" href="https://twitter.com/daishuquee">
          <img src={Twitter} alt="Twitter.png" />
        </a>
      </div>
    </header>
  )
}

export default Header;