import React from "react"
import axios from "axios"
import { useParams } from "react-router-dom"
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
    axios.get(`http://dairs.derbaum.rocks/api/v1/user/${this.props.params.username}`)
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
        {JSON.stringify(this.state.data)}
      </main>
    )
  }

}

export default withRouter(Profile)