import React from 'react'
import axios from "axios"
import '../../styles/Leaderboard.scss'
import conf from '../../../../../conf/general.json';

class Redeems extends React.Component {
  
  state = {
    data: [],
    connected: true
  }

  componentDidMount = () => {
    axios.get(`${conf.www.host}/api/v1/stats/redeems/`)
      .then((res) => {
        this.setState({data: res.data, connected: true})
      })
      .catch((err) => {
        this.setState({connected: false})
        console.log(err);
      })
  }

  render () {
    return (
      <div className="Redeems Leaderboard Main">
      <div className="Redeems LeaderboardRow">
        <div>Name</div>
        <div>Description</div>
        <div>Number used</div>
      </div>
      {this.state.data.map((entry, index) => (
        <div key={index} className="Redeems LeaderboardRow">
          <div>{entry.name}</div>
          <div>{entry.description}</div>
          <div>{entry.used}</div>
        </div>
      ))}

        {this.state.connected ? "" : "Couldn't fucking get stuff"}
    </div>
    )
  }
}

export default Redeems