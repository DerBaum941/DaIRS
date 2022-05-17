import React from "react";

import '../../styles/Profile.scss';

class UserCard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      dataLoaded: false
    }
  }

  componentDidUpdate = (props) => {
    if (props.data !== this.props.data && this.props.data !== undefined)
    this.setState({
      dataLoaded: true
    })
  }

  render () {
    return (
      <div className={"UserCard " + (this.state.dataLoaded ? "" : "Hide")}>
        <div className="UserCardHeader">
          {
            this.state.dataLoaded === true && [
              <img key={10} src={this.props.data.avatar} alt="" />,
              <p key={11}>{this.props.data.name}</p>
            ]}
        </div>

        <div className="UserCardBody">
          {
            this.state.dataLoaded === true && [
            <p key={1}>
              Following: {this.props.data.isFollow ? "Yes" : "No"}
            </p>,

            this.props.data.isFollow === true &&
            <p key={2}>
              Followage: {this.props.data.followAge}
            </p>,
            
            <p key={3}>Last seen: {this.props.data.msgSent === 0 ? "Never chatted" : this.props.data.lastSeen.split('T')[0]
            }</p>,

            this.props.data.totalRedeems !== null &&
            <p key={4}>
              Spent on Taxes: {this.props.data.totalRedeems * 3} points
            </p>,

            this.props.data.streakCount !== null &&
            <p key={5}>
              Current Tax Streak: {this.props.data.streakCount}
            </p>,

            this.props.data.streakActive !== null &&
            <p key={6}>
              Currently Evading Taxes: {this.props.data.streakActive ? "No" : "Yes"}
            </p>,

            this.props.data.pointsSpent !== null &&
            <p key={7}>
              Points spent on Daishu: {this.props.data.pointsSpent}
            </p>,

            this.props.data.redeemsGot !== null &&
            <p key={8}>
              Redeems fulfilled by Daishu: {this.props.data.redeemsGot}
            </p>,

            this.props.data.linksRequested !== 0 &&
            <p key={9}>
              No. of links mods had to suffer through: this.props.data.linksRequested
            </p>          
          ]}
        </div>
    </div>
  )}
}

export default UserCard;