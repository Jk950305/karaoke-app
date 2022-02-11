const React = require('react');

class Modal extends React.Component {
    state = {
        remaining_t : 0,
    };

    calculateRemainingTime(duration, t){
        var remaining_t = (t&&duration)?(parseInt(duration - t)):(0);
        return remaining_t;
    }


    displayModal(){
      var res = [];
      res.push(
          <div>
            <h2>Video will end in {this.calculateRemainingTime(this.props.duration, this.props.t)} seconds.</h2>
            <div><button>replay</button></div>
            <div><button>cancel</button></div>
            <div><button>next</button></div>
          </div>
          );
      return res;
    }

    render() {
        return (
            <div 
                style={{
                    display: (this.calculateRemainingTime(this.props.duration, this.props.t) < 10 && this.calculateRemainingTime(this.props.duration, this.props.t))?('block'):('none'),
                    position: 'absolute',
                    zIndex: '99',
                    background: 'white',
                    width: '50%',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    top:'50%',
                    left:'25%',
                    right:'25%',
                    maxWidth: '500px'
                }}>

                <div>
                  {this.displayModal()}
                </div>
                
                
            </div>
        );
    }
};


export default Modal;
