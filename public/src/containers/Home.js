import React, { Component } from "react";
import { PageHeader, ListGroup } from "react-bootstrap";
import { API, Storage, Auth } from "aws-amplify";
import Uploader from "../components/Uploader";
import "./Home.css";
import App from "../App";

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      testApiCall: []
    };
  }

  async download(link) {
    const result = await API.get(
      "testApiCall",
      `/download?link=${encodeURIComponent(link)}`,
      {
        queryStringParameters: {
          link: encodeURIComponent(link)
        }
      }
    );
    console.log("result:", result);

    window.downloadFile = function(sUrl) {
      //iOS devices do not support downloading. We have to inform user about this.
      if (/(iP)/g.test(navigator.userAgent)) {
        //alert('Your device does not support files downloading. Please try again in desktop browser.');
        window.open(sUrl, "_blank");
        return false;
      }

      //If in Chrome or Safari - download via virtual link click
      if (window.downloadFile.isChrome || window.downloadFile.isSafari) {
        //Creating new link node.
        var link = document.createElement("a");
        link.href = sUrl;
        link.setAttribute("target", "_blank");

        if (link.download !== undefined) {
          //Set HTML5 download attribute. This will prevent file from opening if supported.
          var fileName = sUrl.substring(sUrl.lastIndexOf("/") + 1, sUrl.length);
          link.download = fileName;
        }

        //Dispatching click event.
        if (document.createEvent) {
          var e = document.createEvent("MouseEvents");
          e.initEvent("click", true, true);
          link.dispatchEvent(e);
          return true;
        }
      }

      // Force file download (whether supported by server).
      if (sUrl.indexOf("?") === -1) {
        sUrl += "?download";
      }

      window.open(sUrl, "_blank");
      return true;
    };

    window.downloadFile.isChrome =
      navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
    window.downloadFile.isSafari =
      navigator.userAgent.toLowerCase().indexOf("safari") > -1;

    window.downloadFile(result.presignedUrl);
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) {
      return;
    }

    try {
      const testApiCall = await this.testApiCall();
      this.setState({ testApiCall });
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
        const testApiCall = await this.testApiCall();
        this.setState({ testApiCall });
      } catch (e) {
        alert(e);
      }

      this.setState({ isLoading: false });
    }
  }

  testApiCall() {
    return API.get("testApiCall", "/jobs");
  }

  renderTestAPI(results) {
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
        <h1>Transcriptinator</h1>
        <p>An epic transcription tool worth writing home about</p>
      </div>
    );
  }

  renderDropzone() {
    return <Uploader />;
  }

  renderTest() {
    return (
      <div className="test">
        <div className="dropzone">
          {!this.state.isLoading && this.renderDropzone()}
        </div>
        <ListGroup className="cards">
          {!this.state.isLoading && this.renderTestAPI(this.state.testApiCall)}
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
