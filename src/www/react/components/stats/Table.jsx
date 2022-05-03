import React from "react";

const Table = (props) => {
  return (
    <>
      <div className="Commands2 LeaderboardRow">
        <div>Name</div>
        <div>Description</div>
        <div>Number used</div>
      </div>
      {props.data !== null &&
        props.data.map((entry, index) => (
            <div key={index} className="Commands2 LeaderboardRow">
              <div>{entry.name}</div>
              <div>{entry.description}</div>
              <div>{entry.used}</div>
            </div>
        ))}

      {props.connected === false && <p>Couldn't fucking get stats grr.</p>}
    </>
  )
} 

export default Table;
