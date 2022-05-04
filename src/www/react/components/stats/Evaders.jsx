import React from "react"
import axios from "axios"
import Table from './Table';

import conf from '../../../../../conf/general.json';

import '../../styles/Leaderboard.scss'


class Evaders extends React.Component {

  state = {
    data: [],
    search: null,
    connected: true
  }

  fetchData = () => {
    axios.get(`${conf.www.host}/api/v1/stats/streak/`)
    .then((res) => {

      this.setState({data: res.data.filter( el => el.active !== "Still active")})
    })
    .catch((err) => {
      this.setState({connected: false})
      console.log(err);
    })
  }

  componentDidMount = () => {
    this.fetchData()
  }

  searchTerm = (search) => {
    search.length !== 0 ? this.setState({search}) : this.setState({search: null})
  }

  searchData = () => {
    if (this.state.search === null) return this.state.data
    return this.state.data.filter(e => e.name.toLowerCase().includes(this.state.search.toLowerCase()))
  }

  render() {
    return (
      <div className="Evaders Leaderboard Main">
        <input type="text" onChange={(e) => this.searchTerm(e.target.value)}/>
        <Table data={this.searchData()} connected={this.state.connected} headers={["Name", "Evading"]}/>
      </div>
    )
  }
}

export default Evaders