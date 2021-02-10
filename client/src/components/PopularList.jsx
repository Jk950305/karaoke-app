const React = require('react');

class PopularList extends React.Component {
    
    getPopularList(){
        var result = [];
        var start = (this.props.chartPage-1)*10;
        var end = start+10;
        if(this.props.chartPage>0 && this.props.chartPage<=(this.props.en_chart.length/10)){
            for(var i=start; i<end; i++){
                var elem = this.props.en_chart[i];
                if(elem){
                    var artist = elem.artist;
                    var title = elem.title;
                    result.push(<tr key={i}><td onClick={e=>this.props.findOnYoutube(e)}>{title} - {artist}</td></tr>);
                }
            }
        }
        return result;
    }

    render() {
        return (
            <div style={{display: (this.props.chartPage>0)?('block'):('none')}}>     
                <p className="cursor" style={{float: 'left', margin:'2%', display: (this.props.chartPage>1)?( 'block' ):( 'none' )}} onClick={e=>this.props.moveChart(e)}>
                    prev
                </p>
                
                <p className="cursor" style={{float: 'right', margin:'2%', display: (this.props.chartPage<(this.props.en_chart.length/10) )?( 'block' ):( 'none' )}} onClick={e=>this.props.moveChart(e)}>
                    next
                </p>

                <table className=" table table-hover">
                    <tbody>
                        {this.getPopularList()}
                    </tbody>
                </table>
                
            </div>
        );
    }
};


export default PopularList;
