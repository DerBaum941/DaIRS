import React from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import conf from '../../../../../conf/general.json';

import '../../styles/Leaderboard.scss'


class Evaders extends React.Component {

  state = {
    data: [],
    connected: false
  }

  componentDidMount = () => {
    axios.get(`${conf.www.host}/api/v1/stats/streak/`)
      .then((res) => {
        this.setState({data: res.data.filter( el => el.active !== "Still active")})
      })
      .catch((err) => {
        this.setState({connected: false})
        console.log(err);
      })
  }

  render() {
    return (
      <div className="Evaders Leaderboard Main">
        <div className="Evaders LeaderboardRow">
          <div>Name</div>
          <div>Streak</div>
          <div>Last Active</div>
        </div>
        {this.state.data.map((entry, index) => (
          <div key={index} className="Evaders LeaderboardRow">
            <Link to={`/profile/${entry.name}`}> {entry.name} </Link>
            <div>{entry.value}</div>
            <div>{entry.active}</div>
          </div>
        ))}
        {this.state.connected === false && <p>Couldn't fucking get stats grr.</p>}
      </div>
    )
  }
}

export default Evaders