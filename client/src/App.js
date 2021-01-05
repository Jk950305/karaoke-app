import React, { Component } from 'react';
import './App.css';


import Home from './components/Home.jsx';
import Navigation from './components/Navigation.jsx';
import Contact from './components/Contact.jsx';
import Karaoke from './components/Karaoke.jsx';
import { BrowserRouter, Route, Switch } from 'react-router-dom';


class App extends Component {
  state = {
    response: '',
    post: '',
    responseToPost: '',
  };
  
  componentDidMount() {
    this.callApi()
      .then(res => this.setState({ response: res.express }))
      .catch(err => console.log(err));
  }
  
  callApi = async () => {
    const response = await fetch('/api/hello');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    
    return body;
  };
  
  handleSubmit = async e => {
    e.preventDefault();
    const response = await fetch('/api/world', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: this.state.post }),
    });
    const body = await response.text();
    
    this.setState({ responseToPost: body });
  };
  
render() {
    return (
      <div className="App">
        <p>{this.state.response}</p>
        <form onSubmit={this.handleSubmit}>
          <p>
            <strong>Post to Server:</strong>
          </p>
          <input
            type="text"
            value={this.state.post}
            onChange={e => this.setState({ post: e.target.value })}
          />
          <button type="submit">Submit</button>
        </form>
        <p>{this.state.responseToPost}</p>


        <div>
          <div>
            <BrowserRouter>
          <div>
            <Navigation />
              <Switch>
               <Route path="/" component={Home} exact/>
               <Route path="/contact" component={Contact}/>
               <Route path="/karaoke" component={Karaoke}/>
             </Switch>
          </div> 
        </BrowserRouter>
          </div>
        </div>
                
      </div>
    );
  }
}

export default App;