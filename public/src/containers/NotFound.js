import React from "react";
import "./NotFound.css";

export default () => {
  console.log("window.location.href:", window.location.href);
  window.location.href =
    "https://car5802j9j.execute-api.us-east-1.amazonaws.com/development/" +
    window.location.href.split("/").reverse()[0];
};
