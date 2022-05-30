import React, { useEffect } from 'react'
import Button from 'react-bootstrap/Button';

const Status = {
  RUNNING: '0',
  PENDING_BUYER_CONFIRMATION: '2',
  PENDING_SELLER_CONFIRMATION: '3',
  CONFLICT: '4'
};

const tradeStatusDepenableComponent = (trade, myAddress, isAdmin, actionsOnOpenedTrades) => {
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

  const hadnleBuyerMarkFailed = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[3](parseInt(trade["id"])) // buyerMarkFailedTrade()
  }

  const handleBuyerMarkSuccessful = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[4](parseInt(trade["id"])) // buyerConfirmSuccessfulTrade()
  }

  const handleSellerClaimMoney = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[5](parseInt(trade["id"])) // sellerClaimMoney()
  }

  const handleBuyerClaimMoneyBack = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[6](parseInt(trade["id"])) // buyerClaimMoneyBack()
  }

  const handleSellerConfirmFailure = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[7](parseInt(trade["id"])) // sellerConfirmFailedTrade()
  }

  const handleSellerMarkConflict = (e) => {
    e.preventDefault()
    actionsOnOpenedTrades[8](parseInt(trade["id"])) // sellerMarkConflict()
  }

  const handleResolveConflict = (e, _isSuccessfulTrade) => {
    e.preventDefault()
    actionsOnOpenedTrades[9](parseInt(trade["id"]), _isSuccessfulTrade) // adminResolveConflict()
  }
  
  if (trade["status"] === Status.CONFLICT) {
    return (
      <div className='row'>
        <div className='col-7'>
          <h5 className='text-muted'>CONFLICT</h5>
        </div>
        {/* <div className='col-5 text-end'>
          {
            isAdmin &&
              <>
                <Button className="me-2" variant="danger" onClick={(e) => {handleResolveConflict(e, false)}}>Failed</Button>
                <Button variant="success" onClick={(e) => {handleResolveConflict(e, true)}}>Successful</Button>
              </>
          }
        </div> */}
      </div>
    )
  }

  if (trade["status"] === Status.PENDING_SELLER_CONFIRMATION) { // Handle timing and seller/buyer
    return (
      <div className='row'>
        <div className='col-7'>
          <h5 className='text-muted'>PENDING SELLER CONFIRMATION</h5>
        </div>
        <div className='col-5 text-center'>
          {
            myAddress.toUpperCase() === trade["seller"].toUpperCase() 
            ?
              <>
                <Button className="mb-2" variant="danger" onClick={(e) => {handleSellerConfirmFailure(e)}}>Confirm Failure</Button>
                <Button variant="warning" onClick={(e) => {handleSellerMarkConflict(e)}}>Mark Conflict</Button>
              </>
            : false // (Date.now() - new Date(parseInt(trade["bidAt"]) * 1000)) / (60 * 1000) < 1 
              ?
                <span className="d-inline-block" tabindex="0" data-toggle="tooltip" title="">
                  <Button variant="secondary" style={{"pointer-events": "none"}} disabled>Claim Money Back</Button>
                </span>
              :
                <Button variant="secondary" onClick={(e) => {handleBuyerClaimMoneyBack(e)}}>Claim Money Back</Button>
          }
        </div>
      </div>
    )
  }

  if (trade["status"] === Status.PENDING_BUYER_CONFIRMATION) { // Handle timing and seller/buyer
    return (
      <div className='row'>
        <div className='col-7'>
          <h5 className='text-muted'>PENDING BUYER CONFIRMATION</h5>
        </div>
        <div className='col-5 text-center'>
          {
            myAddress.toUpperCase() === trade["buyer"].toUpperCase() 
            ?
              <>
                <Button className="mx-lg-2 mb-lg-0 mb-2" variant="danger" onClick={(e) => {hadnleBuyerMarkFailed(e)}}>Failed</Button>
                <Button variant="primary" onClick={(e) => {handleBuyerMarkSuccessful(e)}}>Successful</Button>
              </>
            : false // (Date.now() - new Date(parseInt(trade["bidAt"]) * 1000)) / (60 * 1000) < 1 
              ?
                <span className="d-inline-block" tabindex="0" data-toggle="tooltip" title="">
                  <Button variant="success" style={{"pointer-events": "none"}} disabled>Claim Money</Button>
                </span>
              :
                <Button variant="success" onClick={(e) => {handleSellerClaimMoney(e)}}>Claim Money</Button>
          }
        </div>
      </div>
    )
  }

  if (trade["status"] === Status.RUNNING) {
    return (
      <div className='row'>
        <div className='col-7'>
          <h5 className='text-muted'>RUNNING</h5>
        </div>
        <div className='col-5 text-center'>
          {
            myAddress.toUpperCase() === trade["buyer"].toUpperCase() 
            ?
              <>
                <Button className="mx-lg-2 mb-lg-0 mb-2" variant="danger" onClick={(e) => {handleCancel(e)}}>Cancel</Button>
                <Button variant="primary" onClick={(e) => {handleEndBidding(e)}}>End Bindding</Button>
              </>
            : (Date.now() - new Date(parseInt(trade["bidAt"]) * 1000)) / (60 * 1000) < 1 
              ?
                <span className="d-inline-block" tabindex="0" data-toggle="tooltip" title="You can withdraw your bid ONLY if the creator of this trade doesn't end bidding within 1 minute from the time you successfully placed your bid">
                  <Button variant="secondary" style={{"pointer-events": "none"}} disabled>Withdraw</Button>
                </span>
              :
                <Button variant="secondary" onClick={(e) => {handleWithdraw(e)}}>Withdraw</Button>
          }
        </div>
      </div>
    )
  }
}

const MyOpenedTrades = ({ myOpenedTrades, myAddress, isAdmin, actionsOnOpenedTrades }) => {
  return (
    <>
      {
          myOpenedTrades.length > 0 
              ?
              myOpenedTrades.map(trade => {
                return (
                  <div className='row justify-content-center bg-light border rounded my-2'>
                    <div className='col-6'>
                      <div>
                        <b>Trade Id:</b> {trade["id"]}<br/>
                        <b>Buyer/Trade Creator:</b> {trade["buyer"]}<br/>
                        <b>Amount Needed:</b> {trade["amountEnergyNeeded"]} Watt <br/>
                        <b>Number of Minutes:</b> {trade["numOfMins"]} Min <br/>
                        <b>Best bid/Price (so far):</b> {trade["sellingPrice"]} Wei <br/>
                        <b>Seller/Best Bid Provider (so far):</b> {trade["seller"]}<br/>
                        <b>Bid placed before:</b> {((Date.now() - new Date(parseInt(trade["bidAt"]) * 1000)) / (60 * 1000)).toString()} Mins<br/>
                      </div>
                    </div>
                    <div className='col-6 my-auto text-center'>
                      {tradeStatusDepenableComponent(trade, myAddress, isAdmin, actionsOnOpenedTrades)}
                    </div>
                  </div>
                )
              })
              :
              <h5>No Opened Trades to Show!!</h5>
          
      }
    </>
  )
}

export default MyOpenedTrades