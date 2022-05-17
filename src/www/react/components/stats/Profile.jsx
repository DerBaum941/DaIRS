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
    data: []
  }

  componentDidMount = () => {
    axios.get(`${conf.www.host}/api/v1/user/${this.props.params.username}`)
    .then((res) => {
      this.setState({data: res.data})
    })
    .catch((err) => {
      this.setState({data: "Username not found."})
      console.log(err);
    })
  }

  render() {
    return (
      <main className="Profile">
        <NavLink to='/stats'> Back to Stats </NavLink>
        <div className="UserCards">
          <UserCard data={this.state.data} />
        </div>
      </main>
    )
  }
}

export default withRouter(Profile);