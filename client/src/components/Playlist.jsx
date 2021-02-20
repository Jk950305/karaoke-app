const React = require('react');

class Playlist extends React.Component {
    
    getPlaylist(list){
        var res = [];
        for(let i=0; i<list.length; i++){
            res.push(<tr key={i}><td style={{clear:'both', padding:'1%'}}>
                        <p style={{width: '5%', float:'left', margin:'0'}}>
                            {i+1}
                        </p>
                        <div style={{width:'90%', float:'left'}}>
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

    render() {
        return (
            <div className="row" style={{display: (this.props.queue.length<=0)?('none'):('block')  }}>
                <hr/>
                <span className="alert-info alert filename-label" style={{padding:'2px', width:'100%'}}>
                    Playlist
                </span>
                <table className="table" style={{width:'100%', margin:'0%'}}>
                    <tbody>
                        {this.getPlaylist(this.props.queue)}
                    </tbody>
                </table>
            </div>
        );
    }
};


export default Playlist;
