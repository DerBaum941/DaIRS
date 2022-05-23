import React from "react";
import axios from "axios";

import '../../styles/Leaderboard.scss';
import conf from '../../../../../conf/general.json';
import Table from './Table';

class Evaders extends React.Component {

  state = {
    data: [],
    search: null,
    connected: true,
    loading: true
  }

  fetchData = () => {
    axios.get(`${conf.www.host}/api/v1/stats/evaders/`)
    .then((res) => {

      this.setState({data: res.data.filter( el => el.active !== "Still active")})
    })
    .catch((err) => {
      this.setState({connected: false})
      console.log(err);
    })
    .then(() => {
      this.setState({loading: false})
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
        <input placeholder='Search term' type="text" onChange={(e) => this.searchTerm(e.target.value)}/>
        <Table data={this.searchData()} connected={this.state.connected} headers={["Name", "Last Streak", "Evading since"]} nameLinks = {true} loading = {this.state.loading}/>
      </div>
    )
  }
}

export default Evaders;
