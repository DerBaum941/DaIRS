import React from "react";
import axios from "axios";

import Table from "./Table";

import '../../styles/Leaderboard.scss'
import conf from '../../../../../conf/general.json';

class Commands2 extends React.Component {
  
  state = {
    data: [],
    search: null,
    connected: true
  }

  fetchData = () => {
    axios.get(`${conf.www.host}/api/v1/stats/commands/`)
    .then((res) => {

      this.setState({data: res.data.filter( el => el.modOnly === 0), connected: true})
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
    return this.state.data.filter(e => e.name.toLowerCase().includes(this.state.search))
  }

  render () {
    return (
      <div className="Commands2 Leaderboard Main">
        <input type="text" onChange={(e) => this.searchTerm(e.target.value)}/>
        <Table data={this.searchData()} connected={this.state.connected}/>
      </div>
    )
  }
}

export default Commands2