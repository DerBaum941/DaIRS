import React from "react";

import '../styles/Home.scss';
import Gremlin from '../assets/DaiDegen.jpg';

const Home = () => {
  return (
    <main className="Home">
      <img src={Gremlin}/>
      <p>
        Welcome to the humble DaIRS abode. Here you can see stats, enabled commands for the bot, and other crimes you have committed.
      </p>
    </main>
  )
}

export default Home;