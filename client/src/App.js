import React, { Component } from 'react';
import './App.css';

import Navigation from './components/Navigation.jsx';
import Karaoke from './components/Karaoke.jsx';
import { BrowserRouter, Route, Switch } from 'react-router-dom';


class App extends Component {
  
render() {
    return (
        <div className="App">
            <div>
                <div>
                <Karaoke/>
                    {/*<BrowserRouter>
                        <div>
                            <Navigation />
                            <Switch>
                                <Route path="/" component={Karaoke} exact/>
                            </Switch>
                        </div> 
                    </BrowserRouter>
                */}
                </div>
            </div>
            <hr/>
        </div>
    );
  }
}

export default App;