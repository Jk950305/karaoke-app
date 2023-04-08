import React, { Component } from 'react';
import './App.css';

//import Navigation from './components/Navigation.jsx';
import Karaoke from './components/Karaoke.jsx';
//import { BrowserRouter, Route, Switch } from 'react-router-dom';


class App extends Component {
  
render() {
    return (
        <div className="App">
            <div>
                <div>
                <Karaoke/>
                </div>
            </div>
        </div>
    );
  }
}

export default App;