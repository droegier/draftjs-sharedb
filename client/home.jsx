var React =require('react');
 
class Home extends React.Component {
  render() {
    return (
      <div>
        <h2>You are on homepage</h2>
        <p>David: The idea here is to show that
           we can use the same websocket and update different pages.
           The "Dashboard" should fetch all the pages from the Conode MongoDB
           pages collection. And when the user presses on the page. A subscribe call
           is made to the shareDB pubsub module. ATM it is just hard coded.</p>
      </div>
    );
  }
}

module.exports = Home;