import React from "react";
import axios from "axios";
import Table from './Table';

import '../../styles/Leaderboard.scss';
import conf from '../../../../../conf/general.json';


class StatsPage extends React.Component {


  state = {
    data: [],
    search: null,
    connected: true,
    loading: true,
    page: 1,
  }

  fetchData = () => {
    this.setState({loading: true})
    
    if (this.state.page !== 0)
      axios.get(`${conf.www.host}/api/v1/stats/${this.props.endpoint}/${this.state.page}`)
      .then((res) => {
        if (res.data.length === 0) 
          this.setState({ page: 0 })
        else
          this.setState( prevstate => ({
            data: [...prevstate.data, ...res.data],
            connected: true
          }))
      })
      .catch((err) => {
        this.setState({connected: false})
        console.log(err);
      })
      .then(() => {
        this.setState({loading: false})
      })
    }

  loadMore = () => {
    if (this.state.page !== 0)
      this.setState({page: this.state.page + 1}, () => {
        this.fetchData()
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

  renderSwitch = (endpoint) => {
    switch (endpoint) {
      case 'commands':
        return { headers: ["Name", "Description", "Response", "Count"], nameLinks: false }
      case 'streak':
        return { headers: ["Name", "Streak", "Last active"], nameLinks: true }
      case 'evaders':
        return { headers: ["Name", "Last Streak", "Evading since"], nameLinks: true } 
      case 'redeems':
        return { headers: ["Name", "Redeems received"], nameLinks: true }
      case 'message':
        return { headers: ["Name", "Messages sent"], nameLinks: true }
      default:
        return { headers: [], nameLinks: false }
    }
  }

  render() {
    return (
      <div className="Taxes Leaderboard Main">
        <input placeholder='Search term' type="text" onChange={(e) => this.searchTerm(e.target.value)}/>
        <Table data={this.searchData()} connected={this.state.connected} headers={this.renderSwitch(this.props.endpoint).headers} nameLinks={this.renderSwitch(this.props.endpoint).nameLinks} loading = {this.state.loading} columns={this.props.columns}/>
        {this.state.loading === false && this.state.page !== 0 && <button className="LoadMore" onClick={this.loadMore}>Load more</button>}
        {this.state.page === 0 && <p>No more pages available.</p>}
      </div>
    )
  }

}

export default StatsPage;