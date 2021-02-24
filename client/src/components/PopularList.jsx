const React = require('react');

class PopularList extends React.Component {
    state = {
        language : "korean",
    };
    handleLanguage = (e) => {
        this.setState({ language : e.target.id });
        this.props.resetChart();
    }
    
    
    getPopularList(chart){
        var result = [];
        var start = (this.props.chartPage-1)*10;
        var end = start+10;
        if(this.props.chartPage>0 && this.props.chartPage<= (this.getChart().length/10)){
            for(var i=start; i<end; i++){
                var elem = chart[i];
                if(elem){
                    var title = elem.title;
                    result.push(<tr key={i}><td style={{width:'15%'}}></td><td style={{width:'70%'}} onClick={e=>this.props.findOnYoutube(e)}>{title}</td><td style={{width:'15%'}}></td></tr>);
                }
            }
        }
        return result;
    }

    getChart(){
        if(this.state.language==="korean"){
            return this.props.kr_chart;
        }else{
            return this.props.en_chart;
        }
    }




    render() {
        return (
            <div 
                style={{
                    display: (this.props.chartPage>0)?('block'):('none'),
                    position: 'absolute',
                    left: '0',
                    zIndex: '100',
                    background: 'white',
                    opacity: '0.9',
                    width: '80%',
                    marginLeft: '10%',
                    marginRight: '10%'
                }}>
                <div className="row" style={{width: "50%"}}>
                    <div style={{width: "50%", float: "left"}} onChange={this.handleLanguage}>
                        <input 
                            type="radio" 
                            id="korean" 
                            name="language" 
                            value="korean" 
                            style={{ margin:"0"}}
                            checked={this.state.language==="korean"}
                            onChange={this.handleLanguage}
                        />
                        <br/>
                        <label htmlFor="korean" style={{ margin:"0"}}>Korean</label>
                    </div>
                    <div style={{width: "50%", float: "right"}}>
                        <input 
                            type="radio" 
                            id="english" 
                            name="language" 
                            value="english" 
                            style={{ margin:"0"}}
                            checked={this.state.language==="english"}
                            onChange={this.handleLanguage}
                        />
                        <br/>
                        <label htmlFor="english" style={{ margin:"0"}}>English</label>
                    </div>
                </div>
                    

                <table className="table table-hover shrink-fonts">
                    <thead>
                        <tr>
                            <th style={{width:'15%'}}>
                                <p className="cursor" onClick={e=>this.props.moveChart(e)}>
                                    {(this.props.chartPage>1)?( 'prev' ):( '' )}
                                </p>
                            </th>
                            <th style={{width:'70%'}}><p className="numbering"> {this.props.chartPage} </p></th>
                            <th style={{width:'15%'}}>
                                <p className="cursor" onClick={e=>this.props.moveChart(e)}>
                                    {(this.props.chartPage<( this.getChart().length/10) )?( 'next' ):( '' )}
                                </p>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.getPopularList( this.getChart())}
                    </tbody>
                </table>
                
            </div>
        );
    }
};


export default PopularList;
