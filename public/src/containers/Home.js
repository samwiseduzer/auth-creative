import React, { Component } from "react";
import { PageHeader, ListGroup } from "react-bootstrap";
import { API, Auth } from "aws-amplify";
import "./Home.css";
import App from "../App";

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      links: []
    };
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) {
      return;
    }

    try {
      const links = await this.listLinks();
      this.setState({ links });
    } catch (e) {
      alert(e);
    }

    this.setState({ isLoading: false });
  }

  async componentWillReceiveProps(nextProps) {
    if (nextProps.isAuthenticated && !this.isAuthenticated) {
      if (!this.props.isAuthenticated) {
        return;
      }

      try {
        const links = await this.listLinks();
        this.setState({ links });
      } catch (e) {
        alert(e);
      }

      this.setState({ isLoading: false });
    }
  }

  listLinks() {
    return API.get("links", "/links");
  }

  renderLinksList(results) {
    console.log(results);
    return results.map(job => (
      <div
        className="card"
        onClick={() => this.download(job.transcription)}
        key={job.transcription}
      >
        <h4 className="name">
          {
            decodeURIComponent(job.source.split("/").reverse()[0])
              .replace(/\%2/g, "_")
              .replace(/\%3/g, ":")
              .split("/")
              .reverse()[0]
          }
        </h4>
        <div className="status">{job.status}</div>
      </div>
    ));
  }

  renderLander() {
    return (
      <div className="lander">
        <h1>Short Link</h1>
        <p>A highly configurable url shortener</p>
        <div>
          <p>
            This service will help you create shortened urls with optional
            notifications when used
          </p>
        </div>
      </div>
    );
  }

  renderTest() {
    return (
      <div className="test">
        <ListGroup className="cards">
          {!this.state.isLoading && this.renderLinksList(this.state.links)}
        </ListGroup>
      </div>
    );
  }

  render() {
    return (
      <div className="Home">
        {this.props.isAuthenticated ? this.renderTest() : this.renderLander()}
      </div>
    );
  }
}
