import React, { Component } from 'react';
import './App.css';


import Home from './components/Home.jsx';
import Navigation from './components/Navigation.jsx';
import Contact from './components/Contact.jsx';
import Karaoke from './components/Karaoke.jsx';
import { BrowserRouter, Route, Switch } from 'react-router-dom';


class App extends Component {
  
render() {
    return (
        <div className="App">
            <div>
                <div>
                    <BrowserRouter>
                        <div>
                            <Navigation />
                            <Switch>
                                <Route path="/" component={Home} exact/>
                                <Route path="/contact" component={Contact}/>
                                <Route path="/temp" component={Karaoke}/>
                            </Switch>
                        </div> 
                    </BrowserRouter>
                </div>
            </div>
            <hr/>
        </div>
    );
  }
}

export default App;