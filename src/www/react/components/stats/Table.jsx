import React from "react";
import { Link } from "react-router-dom";

import Loading from '../reusable/Loading'

const Table = (props) => {
  return (
    <>
      <div className="LeaderboardRow" style={{borderBottom: '1px solid #df164b', gridTemplateColumns: `repeat(${props.columns}, 1fr)`}}>
        {props.headers !== undefined && props.headers.map((entry, index) => (<div key={index}>{entry}</div>))}
      </div>

      {props.data.length > 0 &&
        props.data.map((entry, index) => (
          <div key={index} className="LeaderboardRow" style={{gridTemplateColumns: `repeat(${props.columns}, 1fr)`}}>

            {props.nameLinks ? 
              <Link to={`/profile/${entry.name}`}>{entry.name}</Link> : 
              <div>{entry.name}</div>}
            
            {entry.description !== undefined && <div>{entry.description}</div>}
            {entry.value !== undefined && <div>{entry.value}</div>}
            {entry.used !== undefined && <div>{entry.used}</div>}
            {entry.active !== undefined && <div>{entry.active}</div>}
          </div>
        ))}

      {props.loading === true && <Loading />}
      {props.connected === false && <p>Couldn't fucking get stats grr.</p>}
    </>
  )
} 

export default Table;