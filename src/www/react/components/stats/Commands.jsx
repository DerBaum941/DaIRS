import React from 'react'
import axios from "axios"
import '../../styles/Leaderboard.scss'
import conf from '../../../../../conf/general.json';

class Commands extends React.Component {
  
  state = {
    data: [],
    connected: true
  }

  componentDidMount = () => {
    axios.get(`${conf.www.host}/api/v1/stats/commands/`)
      .then((res) => {

        this.setState({data: res.data.filter( el => el.modOnly === 0), connected: true})
      })
      .catch((err) => {
        this.setState({connected: false})
        console.log(err);
      })
  }

  render () {
    return (
      <div className="Commands Leaderboard Main">
      <div className="Commands LeaderboardRow">
        <div>Name</div>
        <div>Description</div>
        <div>Number used</div>
      </div>
      {this.state.data.map((entry, index) => (
        <div key={index} className="Commands LeaderboardRow">
          <div>{entry.name}</div>
          <div>{entry.description}</div>
          <div>{entry.used}</div>
        </div>
      ))}
      {this.state.connected === false && <p>Couldn't fucking get stats grr.</p>}
    </div>
    )
  }
}

export default Commands