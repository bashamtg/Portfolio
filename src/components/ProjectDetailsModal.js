import React, { Component } from "react";
import { Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ImageGallery from "react-image-gallery";

import { withAuth0 } from "@auth0/auth0-react";
import LoginButtonAutho from "./LoginButtonAutho";
import Button from "react-bootstrap/Button";
import emailjs from "@emailjs/browser";
import Collapse from "react-bootstrap/Collapse";

class ProjectDetailsModal extends Component {
  componentDidMount() {
    this.setState({ counter: this.props.currentProject.likes });
    this.setState({ comments: this.props.comments });
    this.setState({ likedBy: this.props.currentProject.likedBy });
  }

  handleLikes = (e) => {
    e.preventDefault();
    let updatedProject = {
      likes: (this.props.currentProject.likes += 1),
      likedBy: this.props.auth0.user.name,
      _id: this.props.currentProject._id,
    };
    this.setState({
      counter: this.props.currentProject.likes,
      likedBy: this.props.currentProject.likedBy.push(updatedProject.likedBy),
    });
    this.props.updateProject(updatedProject);
    this.sendNotificationEmail(e, "like");
  };

  handleComments = (e) => {
    e.preventDefault();
    let postedComment = {
      project: this.props.currentProject.project,
      user: this.props.auth0.user.name,
      userEmail: this.props.auth0.user.email,
      text: e.target.comment.value,
      updated: new Date(),
    };
    this.props.postComment(postedComment);
    this.sendNotificationEmail(e, "comment");
  };

  handleUpdateComment = (e) => {
    e.preventDefault();

    let postedComment = {
      project: this.props.commentData.project,
      user: this.props.commentData.user,
      userEmail: this.props.commentData.userEmail,
      text: e.target.comment.value,
      updated: new Date(),
      _id: this.props.commentData._id,
      __V: this.props.commentData.__v,
    };
    this.setState({
      comments: this.props.comments,
    });

    this.props.updateComment(postedComment);

    this.props.hideEditCommentForm();

    // e.target.reset()
  };

  handleReplyComment = (e) => {
    e.preventDefault();
    let postedComment = {
      project:
        this.props.currentProject.project + "." + this.props.commentData._id,
      user: this.props.auth0.user.name,
      userEmail: this.props.auth0.user.email,
      text: e.target.comment.value,
      updated: new Date(),
    };
    this.props.postComment(postedComment);
    this.props.hideReplyForm();
    this.sendNotificationEmail(e, "comment");
    // e.target.reset()
  };

  serverID = process.env.REACT_APP_EMAIL_JS_SERVER_ID;
  commentTemplateID = process.env.REACT_APP_EMAIL_JS_COMMENT_TEMPLATE_ID;
  likeTemplateID = process.env.REACT_APP_EMAIL_JS_LIKE_TEMPLATE_ID;
  publicKey = process.env.REACT_APP_EMAIL_JS_PUBLIC_KEY;
  sendNotificationEmail = (e, commentOrLike) => {
    let templateParams = {};
    let templateID = "";
    if (commentOrLike === "comment") {
      templateParams = {
        from_name: this.props.auth0.user.name,
        comment: e.target.comment.value,
        project: this.props.data.title,
      };
      templateID = this.commentTemplateID;
    }
    if (commentOrLike === "like") {
      templateParams = {
        from_name: this.props.auth0.user.name,
        project: this.props.data.title,
      };
      templateID = this.likeTemplateID;
    }

    emailjs
      .send(this.serverID, templateID, templateParams, this.publicKey)
      .then(
        function (response) {
          console.log("SUCCESS!", response.status, response.text);
        },
        function (error) {
          console.log("FAILED...", error);
        }
      );
  };

  render() {
    let likeButton = () => {
      if (
        this.props.auth0.isAuthenticated &&
        this.props.currentProject.likedBy &&
        !this.props.currentProject.likedBy.includes(this.props.auth0.user.name)
      ) {
        return (
          <Button style={{ float: "left" }} onClick={this.handleLikes}>
            ❤️ {this.props.currentProject.likes}
          </Button>
        );
      } else {
        return <p className="text-left">❤️{this.props.currentProject.likes}</p>;
      }
    };

    let commentFormOrLoginButton = () => {
      if (
        this.props.auth0.isAuthenticated &&
        this.props.showReplyFormState === false &&
        this.props.showCommentUpdateForm === false
      )
        return (
          <form className="w-50" onSubmit={this.handleComments}>
            <input required id="comment" type="text" className="w-100"></input>
            <Button className="w-100" variant="outline-primary" type="submit">
              Comment
            </Button>
          </form>
        );
      else if (!this.props.auth0.isAuthenticated) return <LoginButtonAutho />;
    };

    let editCommentButton = (commentData, alignLeft) => {
      if (this.props.auth0.isAuthenticated) {
        if (
          commentData.user === this.props.auth0.user.name &&
          this.props.showCommentUpdateForm === false
        ) {
          if (alignLeft === true) {
            return (
              <button
                onClick={() => this.props.showEditCommentForm(commentData)}
                style={{
                  padding: 0,
                  border: "none",
                  background: "none",
                }}
              >
                <img
                  alt="edit icon"
                  src="https://img.icons8.com/nolan/64/edit--v1.png"
                  width={20}
                />
              </button>
            );
          } else
            return (
              <button
                onClick={() => this.props.showEditCommentForm(commentData)}
                style={{
                  padding: 0,
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  whiteSpace: " nowrap",
                  overflow: "hidden",
                }}
              >
                <img
                  alt="edit icon"
                  src="https://img.icons8.com/nolan/64/edit--v1.png"
                  width={20}
                />
              </button>
            );
        }
      }
    };

    let imageGalleryData = () => {
      if (this.props.data.images) {
        return this.props.data.images.map((image) => {
          return { original: image };
        });
      }
    };

    let deleteCommentButton = (commentData, alignLeft) => {
      if (this.props.auth0.isAuthenticated) {
        if (commentData.user === this.props.auth0.user.name) {
          if (alignLeft === true) {
            return (
              <svg
                style={{ width: "2%", cursor: "pointer" }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                onClick={() => this.props.deleteComment(commentData._id)}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            );
          } else
            return (
              <svg
                style={{ width: "4%", cursor: "pointer" }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                onClick={() => this.props.deleteComment(commentData._id)}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            );
        }
      }
    };

    let editCommentForm = () => {
      if (this.props.showCommentUpdateForm === true) {
        return (
          <form onSubmit={this.handleUpdateComment}>
            <input
              required
              placeholder={this.props.commentData.text}
              defaultValue={this.props.commentData.text}
              id="comment"
              type="text"
              className="w-100"
            ></input>
            <Button className="w-100" variant="outline-primary" type="submit">
              Comment
            </Button>
          </form>
        );
      }
    };

    let replyCommentForm = (commentData) => {
      if (
        this.props.showReplyFormState === true &&
        this.props.commentData._id === commentData._id
      ) {
        return (
          <form className="mt-2 w-50" onSubmit={this.handleReplyComment}>
            <input required id="comment" type="text" className="w-100"></input>
            <Button className="w-100" variant="outline-primary" type="submit">
              Comment
            </Button>
          </form>
        );
      }
    };

    let replyButton = (commentData) => {
      if (
        this.props.showReplyFormState === false &&
        this.props.auth0.isAuthenticated
      )
        return (
          <Button onClick={() => this.props.showReplyForm(commentData)}>
            Reply
          </Button>
        );
    };

    const filteredComments = this.props.comments.filter(
      (comments) => this.props.currentProject.project === comments.project
    );

    console.log(this.props.currentProject);

    let filteredReplies = (commentData) => {
      if (commentData) {
        let replyID =
          this.props.currentProject.project + "." + commentData._id.toString();

        let filtered = this.props.comments.filter(
          (comments) => replyID === comments.project
        );

        return filtered.map((commentData) => {
          return (
            <div
              className="border-bottom w-50 text-right float-right"
              key={commentData._id}
              style={{
                padding: 10,
                textAlign: "right",
              }}
            >
              <h2 className="font-weight-bold m-0">{commentData.user}</h2>
              <div
                className="d-inline-block float-right "
                style={{ float: "right" }}
              >
                {editCommentButton(commentData, false)}
                {deleteCommentButton(commentData, false)}
                <p
                  className="text-secondary text-right"
                  style={{ fontSize: "70%", marginTop: 0 }}
                >
                  {new Date(commentData.updated).toLocaleString()}
                </p>
              </div>

              <p className="mt-2 ">{commentData.text}</p>
            </div>
          );
        });
      }
    };
    let comments = () => {
      if (this.props.showCommentUpdateForm === false) {
        return filteredComments.map((commentData) => {
          return (
            <div
              id={commentData._id}
              style={{
                textAlign: "left",
                padding: 10,
              }}
              key={commentData._id}
              className="col-md-10"
            >
              <h2 className="font-weight-bold m-0">{commentData.user}</h2>

              <div className="d-flex flex-row ">
                <p
                  className="text-secondary"
                  style={{ fontSize: "70%", marginTop: 0 }}
                >
                  {new Date(commentData.updated).toLocaleString()}
                </p>

                {deleteCommentButton(commentData, true)}
                {editCommentButton(commentData, true)}
              </div>

              <p className="mt-2 w-50">{commentData.text}</p>
              {replyButton(commentData)}
              {replyCommentForm(commentData)}
              {filteredReplies(commentData)}
            </div>
          );
        });
      }
    };

    if (this.props.data) {
      const technologies = this.props.data.technologies;
      var title = this.props.data.title;
      var description = this.props.data.description;
      var url = this.props.data.url;
      if (this.props.data.technologies) {
        var tech = technologies.map((icons, i) => {
          return (
            <li className="list-inline-item mx-3" key={i}>
              <span>
                <div className="text-center">
                  <i className={icons.class} style={{ fontSize: "300%" }}>
                    <p className="text-center" style={{ fontSize: "30%" }}>
                      {icons.name}
                    </p>
                  </i>
                </div>
              </span>
            </li>
          );
        });
      }
    }
    let teamHTML = () => {
      if (this.props.data.descriptionHTML) {
        const descriptionHTML = this.props.data.descriptionHTML;
        return <p dangerouslySetInnerHTML={{ __html: descriptionHTML }} />;
      }
    };

    return (
      <Modal
        {...this.props}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        className="modal-inside"
      >
        <div
          className=" modal-buttons "
          style={{ paddingBottom: "50px", textAlign: "left", maxWidth: "150%" }}
        >
          <div className="slider-tab">
            <button
              onClick={this.props.onHide}
              style={{
                padding: 0,
                border: "none",
                background: "none",
                marginRight: 10,
              }}
            >
              <span
                className="iconify slider-iconfiy"
                data-icon="emojione:red-circle"
                data-inline="false"
                style={{ marginLeft: "5px" }}
              ></span>
            </button>
            &nbsp;
            <button
              onClick={this.props.fadeAbout}
              style={{
                padding: 0,
                border: "none",
                background: "none",
                marginRight: 10,
              }}
            >
              <span
                className="iconify slider-iconfiy"
                data-icon="twemoji:yellow-circle"
                data-inline="false"
              ></span>{" "}
            </button>
            &nbsp;
            <button
              onClick={this.props.showIframe}
              style={{
                padding: 0,
                border: "none",
                background: "none",
              }}
            >
              <span
                className="iconify slider-iconfiy"
                data-icon="twemoji:green-circle"
                data-inline="false"
              ></span>
            </button>
          </div>
          {this.props.showIframeState ? (
            <iframe title={title} src={url} class="modal-iframe"></iframe>
          ) : (
            <ImageGallery items={imageGalleryData()} />
          )}
        </div>
        <div className="col-md-12">
          <Collapse in={!this.props.fadeAboutState}>
            <div className="col-md-12">
              <h3 style={{ padding: "5px 5px 0 5px" }}>
                {title}

                {url ? (
                  <a href={url} target="_blank" rel="noreferrer">
                    <p style={{ fontSize: 11 }}>{url}</p>
                  </a>
                ) : null}
              </h3>

              <p className="modal-description"> {description}</p>

              {teamHTML()}

              <ul className="list-inline mx-auto">{tech}</ul>

              <div className="col-md-12 text-center">
                {likeButton()}
                {commentFormOrLoginButton()}
                {comments()}
                {editCommentButton}
                {editCommentForm()}
              </div>
            </div>
          </Collapse>
        </div>
      </Modal>
    );
  }
}

export default withAuth0(ProjectDetailsModal);
