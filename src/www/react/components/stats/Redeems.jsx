import React from 'react'
import axios from "axios"
import Table from './Table';

import '../../styles/Leaderboard.scss'
import conf from '../../../../../conf/general.json';

class Redeems extends React.Component {
  
  state = {
    data: [],
    search: null,
    connected: true
  }

  fetchData = () => {
    axios.get(`${conf.www.host}/api/v1/stats/redeems/`)
    .then((res) => {
      this.setState({data: res.data, connected: true})
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

  render () {
    return (
      <div className="Redeems Leaderboard Main">
        <input placeholder='Search term' type="text" onChange={(e) => this.searchTerm(e.target.value)}/>
        <Table data={this.searchData()} connected={this.state.connected} headers={["Name", "Value"]} nameLinks = {true}/>
      </div>
    )
  }
}

export default Redeems