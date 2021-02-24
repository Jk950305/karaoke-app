const React = require('react');

class YoutubeList extends React.Component {
    
    getYoutubeList(){
        var res = [];
        for(const [key,value] of this.props.yt_list.entries()){
            if(value.message){
                res.push(<tr key="-1"><td><p>{value.message}</p></td></tr>);
            }else{
                res.push(<tr key={key}><td>
                    <div className="yt_element">
                        <div className="yt_thumb">
                            <img src={value.thumbnail} alt="" className="yt_image"/>
                            <p className="yt_time">({value.time})</p>
                        </div>
                        <div className="yt_info">
                            <p className="yt_title">{value.title}</p>
                            <p className="yt_author">{value.author}</p> 
                        </div>
                        <div className="yt_reserve">
                            <button 
                                className="btn btn-danger btn-sm"
                                onClick={e => this.props.getMedia(e,value.title,value.url)}
                            >
                                play
                            </button>

                            <button 
                                className="btn btn-primary btn-sm"
                                style={{'display' : (this.props.action!=='stop'||this.props.loading==='loading')?('block'):('none')}}
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
                    left: '0',
                    zIndex: '100',
                    background: 'white',
                    opacity: '1.0',
                    width: '80%',
                    marginLeft: '10%',
                    marginRight: '10%'

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
