var React = require('react');
var editor = require('./editor.jsx');
var Home = require('./home.jsx');
var { Route, NavLink, HashRouter } = require('react-router-dom');

class Main extends React.Component {
  render() {
    var pagesId = ["123", "456", "789"];
    return (
      <HashRouter>
        <div>
          <h1>Pages DashBoard</h1>
          <ul className="header">
                <li><NavLink exact to="/">HomePage</NavLink></li>
                <li><NavLink exact to="/page/123">{'Page' + ' ' + '123'}</NavLink></li>
                <li><NavLink exact to="/page/456">{'Page' + ' ' + '456'}</NavLink></li>
                <li><NavLink exact to="/page/789">{'Page' + ' ' + '789'}</NavLink></li>
          </ul>
          <div className="content">
          <Route exact path="/" component={Home}/>
          <Route exact path="/page/123" render={(props) => (
              <editor.RichEditorExample {...props} pageId='545f90d3-ec21-4f32-b15d-9f48b9d3c23b'/>
          )}/>
          <Route exact path="/page/456" render={(props) => (
              <editor.RichEditorExample {...props} pageId='f324cfb0-5516-4070-9d00-7501b2aeeacc'/>
          )}/>
          <Route exact path="/page/789" render={(props) => (
              <editor.RichEditorExample {...props} pageId='9d3a3dd8-accb-46b0-bf8d-a76a6690d1da'/>
          )}/>
          </div>
        </div>
      </HashRouter>
    );
  }
}

module.exports = Main;