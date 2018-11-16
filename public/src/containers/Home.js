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

    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleNoteChange = this.handleNoteChange.bind(this);
    this.handlePhoneChange = this.handlePhoneChange.bind(this);
    this.handleWebhookChange = this.handleWebhookChange.bind(this);
    this.createLink = this.createLink.bind(this);
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

  handleUrlChange(event) {
    this.setState({
      newLinkUrl: event.target.value
    });
  }

  handleTitleChange(event) {
    this.setState({
      newLinkTitle: event.target.value
    });
  }

  handlePhoneChange(event) {
    this.setState({
      newLinkPhone: event.target.value
    });
  }

  handleNoteChange(event) {
    this.setState({
      newLinkNote: event.target.value
    });
  }

  handleWebhookChange(event) {
    this.setState({
      newLinkWebhook: event.target.value
    });
  }

  createLink() {
    console.log(this);

    const url =
      this.state.newLinkUrl &&
      (this.state.newLinkUrl.startsWith("http://") ||
        this.state.newLinkUrl.startsWith("https://"))
        ? this.state.newLinkUrl
        : `http://${this.state.newLinkUrl}`;
    const note = this.state.newLinkNote;
    const title = this.state.newLinkTitle;
    const phone = this.state.newLinkPhone;
    const webhook = this.state.newLinkWebhook;

    const payload = {
      url,
      note,
      title,
      notificationPhone: phone,
      webhook
    };
    this.addLink(payload).then(link => {
      const newLinks = [link, ...this.state.links];
      this.setState({
        newLinkNote: "",
        newLinkPhone: "",
        newLinkUrl: "",
        newLinkTitle: "",
        newLinkWebhook: "",
        links: newLinks
      });
    });
  }

  listLinks() {
    return API.get("links", "/links");
  }

  addLink(payload) {
    console.log("payload:", payload);
    return API.post("links", "/links", { body: payload });
  }

  updateLink(code, payload) {
    return API.put("links", `/links/${code}`, { body: payload });
  }

  deleteLink(code) {
    return API.del("links", `/links/${code}`);
  }

  handleDeleteLink(code) {
    this.deleteLink(code).then(() => {
      const newLinks = this.state.links.filter(link => link.code != code);
      this.setState({ links: newLinks });
    });
  }

  renderLinksList(results) {
    console.log(results);
    return results.map(link => (
      <div className="card" key={link._id}>
        <h4 className="name">{link.title}</h4>
        <div className="status">URL: {link.url}</div>
        <div className="status">
          SHORT URL: <a href={link.link}>{link.link}</a>
        </div>
        <div className="status">NOTE: {link.note}</div>
        <button onClick={() => this.handleDeleteLink(link.code)}>Delete</button>
        <button onClick={() => this.handleGetDetails(link.code)}>
          Details
        </button>
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

  renderContent() {
    return (
      <div>
        <div>
          <input type="url" placeholder="url" onChange={this.handleUrlChange} />
          <input
            type="text"
            placeholder="title"
            onChange={this.handleTitleChange}
          />
          <input
            type="number"
            placeholder="phone number"
            onChange={this.handlePhoneChange}
          />
        </div>
        <div>
          <textarea
            name=""
            id=""
            cols="30"
            rows="10"
            placeholder="Note"
            onChange={this.handleNoteChange}
          />
        </div>
        <div>
          <button onClick={this.createLink}>Save</button>
        </div>
        <div className="test">
          <ListGroup className="cards">
            {!this.state.isLoading && this.renderLinksList(this.state.links)}
          </ListGroup>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="Home">
        {this.props.isAuthenticated
          ? this.renderContent()
          : this.renderLander()}
      </div>
    );
  }
}
