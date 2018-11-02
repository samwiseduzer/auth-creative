import React, { Component } from "react";
import Dropzone from "react-dropzone";
import axios from "axios";
import config from "../config";
import { API, Storage, Auth } from "aws-amplify";

export default class Uploader extends Component {
  async _onDrop(files) {
    var file = files[0];
    const user = await Auth.currentUserInfo();
    console.log("user:", user);
    const customPrefix = {
      public: `user/${user.id}/${user.attributes.phone_number.slice(1)}/`,
      protected: "protected/",
      private: "private/"
    };
    Storage.put(file.name, file, {
      customPrefix,
      contentType: file.type
    })
      .then(result => console.log(result))
      .catch(err => console.log(err));
  }

  render() {
    return (
      <Dropzone onDrop={this._onDrop}>
        <div>Drop an mp3 file here!</div>
      </Dropzone>
    );
  }
}
