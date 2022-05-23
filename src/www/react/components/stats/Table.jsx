import React from "react";
import { Link } from "react-router-dom";

import Loading from '../reusable/Loading'

const Table = (props) => {
  return (
    <>
      
      <div className="LeaderboardRow" style={{borderBottom: '1px solid #df164b'}}>
        {props.headers !== undefined && props.headers.map((entry, index) => (<div key={index}>{entry}</div>))}
      </div>
      {props.loading === true && <Loading />}
      {props.data !== null && props.nameLinks === false &&
        props.data.map((entry, index) => (
            <div key={index} className="LeaderboardRow">
              <div>{entry.name}</div>
              {entry.description !== undefined && <div>{entry.description}</div>}
              {entry.value !== undefined && <div>{entry.value}</div>}
              {entry.used !== undefined && <div>{entry.used}</div>}
              {entry.active !== undefined && <div>{entry.active}</div>}
            </div>
        ))}

      {props.data.length > 0 && props.nameLinks === true &&
        props.data.map((entry, index) => (
          <div key={index} className="LeaderboardRow">
            <Link to={`/profile/${entry.name}`}>{entry.name}</Link>
            {entry.description !== undefined && <div>{entry.description}</div>}
            {entry.value !== undefined && <div>{entry.value}</div>}
            {entry.used !== undefined && <div>{entry.used}</div>}
            {entry.active !== undefined && <div>{entry.active}</div>}
          </div>
        ))}

      {props.connected === false && <p>Couldn't fucking get stats grr.</p>}
    </>
  )
} 

export default Table;