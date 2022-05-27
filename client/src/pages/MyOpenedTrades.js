import React, { useEffect } from 'react'
import Button from 'react-bootstrap/Button';

const Status = {
  RUNNING: '0',
  PENDING_BUYER_CONFIRMATION: '2',
  PENDING_SELLER_CONFIRMATION: '3',
  CONFLICT: '4'
};

const tradeStatusDepenableComponent = (trade, address, actionsOnOpenedTrades) => {
  const handleCancel = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[0](parseInt(trade["id"])) // cancelTrade()
  }

  const handleEndBidding = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[1](trade) // EndBidding()
  }

  const handleWithdraw = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[2](parseInt(trade["id"])) // withdrawBid()
  }

  if (trade["status"] === Status.CONFLICT) {
    return <h5 className='text-lead text-warning'>CONFLICT</h5>
  }

  if (trade["status"] === Status.PENDING_SELLER_CONFIRMATION) { // Handle timing and seller/buyer
    return <h5 className='text-lead text-primary'>PENDING SELLER CONFIRMATION</h5>
  }

  if (trade["status"] === Status.PENDING_BUYER_CONFIRMATION) { // Handle timing and seller/buyer
    return <h5 className='text-lead text-primary'>PENDING BUYER CONFIRMATION</h5>
  }

  if (trade["status"] === Status.RUNNING) {
    return (
      <div className='row'>
        <div className='col-7'>
          <h5 className='text-lead text-muted'>RUNNING</h5>
        </div>
        <div className='col-5 text-end'>
          {
            address.toUpperCase() === trade["buyer"].toUpperCase() 
            ?
              <>
                <Button className="mx-lg-2 mb-lg-0 mb-2" variant="danger" onClick={(e) => {handleCancel(e)}}>Cancel</Button>
                <Button variant="primary" onClick={(e) => {handleEndBidding(e)}}>End Bindding</Button>
              </>
            : (Date.now() - new Date(parseInt(trade["bidAt"]) * 1000)) / (60 * 1000) < 1 
              ?
                <span className="d-inline-block" tabindex="0" data-toggle="tooltip" title="You can withdraw your bid ONLY if the creator of this trade doesn't end bidding within 1 minute from the time you successfully placed your bid">
                  <Button variant="warning" style={{"pointer-events": "none"}} disabled>Withdraw</Button>
                </span>
              :
                <Button variant="warning" onClick={(e) => {handleWithdraw(e)}}>Withdraw</Button>
          }
        </div>
      </div>
    )
  }
}

const MyOpenedTrades = ({ myOpenedTrades, myAddress, actionsOnOpenedTrades }) => {
  return (
    <>
      <h4>My Opened Trades</h4>
      {
          myOpenedTrades.length > 0 
              ?
              myOpenedTrades.map(trade => {
                return (
                  <div className='row justify-content-center'>
                    <div className='col-6'>
                      <div>
                        <b>Trade Id:</b> {trade["id"]}<br/>
                        <b>Buyer/Trade Creator:</b> {trade["buyer"]}<br/>
                        <b>Amount Needed:</b> {trade["amountEnergyNeeded"]} Watt <br/>
                        <b>Number of Minutes:</b> {trade["numOfMins"]} Min <br/>
                        <b>Best bid/Price (so far):</b> {trade["sellingPrice"]} Wei <br/>
                        <b>Seller/Best Bid Provider (so far):</b> {trade["seller"]}<br/>
                        {/* <b>Bid at:</b> {(new Date(parseInt(trade["bidAt"]) * 1000)).toString()}<br/> */}
                        <b>Bid placed before:</b> {((Date.now() - new Date(parseInt(trade["bidAt"]) * 1000)) / (60 * 1000)).toString()} Mins<br/>
                      </div>
                    </div>
                    <div className='col-6 my-auto text-center'>
                      {tradeStatusDepenableComponent(trade, myAddress, actionsOnOpenedTrades)}
                    </div>
                    <hr/>
                  </div>
                );
              })
              :
              <h5>No Opened Trades to Show!!</h5>
          
      }
    </>
  )
}

export default MyOpenedTrades