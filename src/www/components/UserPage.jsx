import React from "react"

const UserPage = (props) => {
  return (

    <div>
      User ID: {props.id} <br />
      Display Name: {props.display_name} <br />
      Bio: {props.description} <br /> 
      Image: <img src={props.profile_image_url} /> <br />
      
      <img `profile_image_url` />
    </div>

  )
}

export default UserPage