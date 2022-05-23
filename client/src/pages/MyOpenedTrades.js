import React, { useEffect } from 'react'
import Button from 'react-bootstrap/Button';
// import { BsExclamationCircleFill } from "react-icons/bs"
// import { GrValidate } from "react-icons/gr"

const Status = {
  RUNNING: '0',
  PENDING_BUYER_CONFIRMATION: '2',
  PENDING_SELLER_CONFIRMATION: '3',
  CONFLICT: '4'
};

const tradeStatusDepenableComponent = (trade, address, actionsOnOpenedTrades) => {
  const handleCancel = (e, tradeId) => {
    e.preventDefault()
    // alert(`Trade Id = ${tradeId}`)
    actionsOnOpenedTrades[0](tradeId) // cancelTrade
  }

  if (trade["status"] === Status.CONFLICT) {
    return <h5 className='text-lead text-warning'>CONFLICT</h5>
  }

  if (trade["status"] === Status.PENDING_SELLER_CONFIRMATION) { // Handle timing and seller/buyer
    return <h5 className='text-lead text-primary'>PENDING SELLER CONFIRMATION</h5>
  }

  if (trade["status"] === Status.PENDING_BUYER_CONFIRMATION) { // Handle timing and seller/buyer
    return <h5 className='text-lead text-primary'>PENDING SELLER CONFIRMATION</h5>
  }

  if (trade["status"] === Status.RUNNING) {
    if (address === trade["buyer"]) {
      return (
        <>
          <Button className="mx-lg-2 mb-lg-0 mb-2" variant="secondary" onClick={(e) => {handleCancel(e, parseInt(trade["id"]))}}>Cancel</Button>
          <Button variant="primary">End Bindding</Button>
        </>
      )
    } else { // Seller
      return <h5 className='text-lead text-primary'>RUNNING</h5>
    }
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
                    <div className='col-9'>
                      <div>
                        <b>Trade Id:</b> {trade["id"]}<br/>
                        <b>Buyer/Trade Creator:</b> {trade["buyer"]}<br/>
                        <b>Amount Needed:</b> {trade["amountEnergyNeeded"]} Watt <br/>
                        <b>Number of Minutes:</b> {trade["numOfMins"]} Min <br/>
                        <b>Best bid/Price (so far):</b> {trade["sellingPrice"]} Wei <br/>
                        <b>Seller/Best Bid Provider (so far):</b> {trade["seller"]}<br/>
                      </div>
                    </div>
                    <div className='col-3 my-auto text-center'>
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