import React from "react";

import '../styles/Home.scss';
import Gremlin from '../assets/DaiDegen.jpg';

const Home = () => {
  return (
    <main className="Home">
      <p>
        Welcome to the humble DaIRS abode. Here you can see stats, enabled commands for the bot, and other crimes you have committed.
      </p>
      <img src={Gremlin}/>
      <p style= {{fontSize: 15}}>
        DISCLAIMER: The contents of this website are satire and jokes between Daishu and her chat. Do not take them seriously. <br /> <br />
        DISCLAIMER 2: The contents of this website are designed for desktop viewing and might not look good on mobile as of yet.
      </p>
    </main>
  )
}

export default Home;