import React from "react"
import axios from "axios"
import { useParams, Link } from "react-router-dom"
import UserCard from "./UserCard"
import conf from '../../../../../conf/general.json';


import '../../styles/Leaderboard.scss'

// Wrapper function component so url params can be parsed
const withRouter = WrappedComponent => props => {
  const params = useParams();
  // etc... other react-router-dom v6 hooks

  return (
    <WrappedComponent
      {...props}
      params={params}
      // etc...
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
        <Link to='/stats'> Back to Stats </Link>
        <p>
          Hello, below you can find all of the relevant stats for the channel.
        </p>
        {/* <p>
          {JSON.stringify(this.state.data)}
        </p> */}

        <div className="UserCards">
          <UserCard data={this.state.data} />
        </div>
      </main>
    )
  }

}

export default withRouter(Profile)