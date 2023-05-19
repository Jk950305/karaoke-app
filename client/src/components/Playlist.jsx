const React = require('react');

class Playlist extends React.Component {
    state = {
        open : true,
    };
    
    getPlaylist(list){
        var res = [];
        for(let i=0; i<list.length; i++){
            res.push(<tr key={i}><td style={{clear:'both', padding:'1%'}}>
                        <p style={{width: '5%', float:'left', margin:'0'}}>
                            {i+1}
                        </p>
                        <div style={{width:'90%', float:'left'}} onClick={e => {this.props.getMedia(e,list[i].title,list[i].url); this.props.removeFromQueue(e,i)} }>
                            {list[i].title}
                        </div>
                        <p
                            className="cursor"
                            style={{width:'5%', color:'red', float:'left'}}
                            onClick={e=>this.props.removeFromQueue(e,i)}
                        >X</p>
                    </td></tr>);
        }
        return res;
    }

    toggle(e){
        e.preventDefault();
        var truth_value = this.state.open;
        this.setState({open: !truth_value});
    }

    render() {
        return (
            <div className="row" style={{display: (this.props.queue.length<=0)?('none'):('block')  }}>
                <span className="alert-info alert filename-label" style={{padding:'2px', width:'100%'}}>
                    <p style={{marginBottom:"0",paddingBottom:"0"}} className="cursor" onClick={e=>this.toggle(e)}>Playlist ( {this.props.queue.length} ) {(this.state.open)?('▲'):('▼')}</p>
                </span>
                <table className="table" style={{width:'100%', margin:'0%', display: (this.state.open)?(""):("none") }}>
                    <tbody>
                        {this.getPlaylist(this.props.queue)}
                    </tbody>
                </table>
            </div>
        );
    }
};


export default Playlist;
