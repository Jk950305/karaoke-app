const React = require('react');

class YoutubeList extends React.Component {
    
    getYoutubeList(){
        var res = [];
        for(const [key,value] of this.props.yt_list.entries()){
            if(value.message){
                res.push(<tr key="-1"><td><p>{value.message}</p></td></tr>);
            }else{
                res.push(<tr key={key}><td>
                    <div className="yt_element row">
                        <div className="yt_thumb col-md-1" >
                            <img src={value.thumbnail} alt="" className="yt_image"/>
                            <p className="yt_time">({value.time})</p>
                        </div>
                        <div className="yt_info col-md-1" >
                            <p className="yt_title">{value.title}</p>
                            <p className="yt_author">{value.author}</p> 
                        </div>
                        <div className="yt_reserve col-md-1" >
                            <button 
                                className="btn btn-danger btn-sm"
                                onClick={e => this.props.getMedia(e,value.title,value.url)}
                                style={{}}
                            >
                                play
                            </button>

                            <button 
                                className="btn btn-primary btn-sm"
                                style={{'display' : (this.props.action!=='stop'||this.props.loading==='loading'||this.props.queue.length>0)?('block'):('none')}}
                                onClick={e => this.props.enqueueMusic(e,value.title,value.url)}
                            >
                                rsrv
                            </button>
                        </div>
                    </div></td></tr>
                )
            }
        }
        return res;
    }

    render() {
        return (
            <div 
                className="yt_table" 
                style={{
                    display: (this.props.yt_list.length>0)?('initial'):('none'),
                    position: 'absolute',
                    zIndex: '100',
                    background: 'white',
                    opacity: '0.85',
                    width: '100%',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    left:'0',
                    right:'0',
                    maxWidth: '1000px'

                }}
            >
            <hr/> 
                <div className="row">
                    <table className="table">
                        <tbody>
                            {this.getYoutubeList()}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
};


export default YoutubeList;
