import React from "react"
import '../styles/Login.scss'

const Login = () => {
  return (
    <div className="Login">
      <div className="Button">
        <a href="http://localhost:3000/auth/twitch">
          <img src="https://cdn.betterttv.net/emote/58ae8407ff7b7276f8e594f2/3x" />
          <b>Click to give away all your data</b>
        </a>
      </div>
      <div className="Button">
        <a href="http://localhost:3000/auth/twitch/user">
          <img src="https://cdn.betterttv.net/emote/58ae8407ff7b7276f8e594f2/3x" />
          <b>Click to let me look at your channel</b>
        </a>
      </div>
    </div>
  )
}

export default Login