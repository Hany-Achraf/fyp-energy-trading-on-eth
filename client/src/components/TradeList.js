// import React, { useState, useEffect } from "react";
import React from "react";

const TradeList = ({ trades }) => {
    // const [runningTrades, setRunningTrades] = useState([]);

    // useEffect( () => {
    //         setRunningTrades(trades.filter(trade => trade[8] !== 0));
    //  }, [trades]);

  return (
      <>
        <h4>Running Trades List</h4>
        {
            trades.length > 0 
                ?
                    // runningTrades.map(trade => {
                    trades.map(trade => {
                        return <div>
                            <b>Trade Id:</b> {trade[0]}<br/>
                            <b>Buyer address:</b> {trade[1]}<br/>
                            <b>Buyer deposit:</b> {trade[2]} wei <br/>
                            <b>Amount Needed:</b> {trade[3]} Watt <br/>
                            <b>Number of Hours:</b> {trade[4] / 60} Hr
                            <hr/>
                        </div>;
                    })
                :
                <h5>No Trades to Show!!</h5>
            
        }
      </>
  );
}

export default TradeList;