import React from "react"
import '../styles/Home.scss'
import Gremlin from '../assets/DaiDegen.jpg'

const Home = () => {
  return (
    <main className="Home">
      <img src={Gremlin}/>
      <p>
        [WIP] <br />
        Welcome to the humble DaIRS abode. Here you can see stats, enabled commands for the bot, and other shit.
      </p>
    </main>
  )
}

export default Home