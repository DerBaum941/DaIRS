import React from "react"
import axios from "axios"
import '../../styles/Leaderboard.scss'


class TaxLeaderboard extends React.Component {

  state = {
    data: [],
    connected: true
  }

  componentDidMount = () => {
    axios.get('http://dairs.derbaum.rocks/api/v1/stats/streak/')
      .then((res) => {
        this.setState({data: res.data, connected: true})
      })
      .catch((err) => {
        this.setState({connected: false})
        console.log(err);
      })
  }

  render() {
    return (
      <div className="Taxes Leaderboard Main">
        <div className="Taxes LeaderboardRow">
          <div>Name</div>
          <div>Streak</div>
          <div>Last Active</div>
        </div>
        {this.state.data.map((entry, index) => (
          <div key={index} className="Taxes LeaderboardRow">
            <div>{entry.name}</div>
            <div>{entry.value}</div>
            <div>{entry.active}</div>
          </div>
        ))}

        {this.state.connected ? "" : "Couldn't fucking get stuff"}
      </div>
    )
  }
}

export default TaxLeaderboard