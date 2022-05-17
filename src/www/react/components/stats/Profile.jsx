import React from "react";
import axios from "axios";
import { useParams, NavLink } from "react-router-dom";

import '../../styles/Leaderboard.scss';
import conf from '../../../../../conf/general.json';
import UserCard from './UserCard';

// Wrapper function component so url params can be parsed
const withRouter = WrappedComponent => props => {
  const params = useParams();
  // etc... other react-router-dom v6 hooks
  return (
    <WrappedComponent
      {...props}
      params={params}
    />
  );
};

class Profile extends React.Component {

  state = {
    data: [],
    search: null,
    error: false
  }

  searchTerm = (search) => {
    search.length !== 0 ? this.setState({search}) : this.setState({search: conf.twitch.channel})
  }

  searchProfile = (e, user) => {
    e.preventDefault()
    axios.get(`${conf.www.host}/api/v1/user/${user}`)
    .then((res) => {
      this.setState({data: res.data, error: false})
    })
    .catch((err) => {
      this.setState({error: true})
    })
  }

  getStats = (user) => {
    if (!user) return
    axios.get(`${conf.www.host}/api/v1/user/${user}`)
    .then((res) => {
      this.setState({data: res.data, error: false})
    })
    .catch((err) => {
      this.setState({error: true})
    })
  }

  componentDidMount = () => {
    this.props.params.username ? this.getStats(this.props.params.username) : this.getStats(conf.twitch.channel)
  }

  render() {
    return (
      <main className="Profile">
        <NavLink to='/stats'> Back to Stats </NavLink>

        <form onSubmit={(e) => this.searchProfile(e, this.state.search)}>
          <input placeholder='Search term' type="text" onChange={(e) => this.searchTerm(e.target.value)} />
          <button type="submit">Search</button>
        </form>
        {this.state.error === true &&
          <p>
            Username not found. Please try searching again.
          </p>
        }


        <div className="UserCards">
          <UserCard data={this.state.data} />
        </div>
      </main>
    )
  }
}

export default withRouter(Profile);