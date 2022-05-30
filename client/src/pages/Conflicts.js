import React, { useState } from 'react'
import { Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { BsQuestionCircle } from "react-icons/bs"
import { FaEthereum } from "react-icons/fa"


const Conflicts = ({ conflicts, adminResolveConflict }) => {
  const [tradeId, setTradeId] = useState(-1)
  const [show, setShow] = useState(false);

  const handleResolveConflict = (tradeId) => {
    setShow(true)
    setTradeId(tradeId)
  }
  
  const resolveConflict = (e, _isSuccessfulTrade) => {
    e.preventDefault()
    adminResolveConflict(tradeId, _isSuccessfulTrade)
    setShow(false)
  }

  return (
    <>
      {
        conflicts.length > 0 
          ?
            conflicts.map(trade => {
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
                    </div>
                  </div>
                  <div className='col-6 my-auto text-center'>
                    <div className='row'>
                      <div className='col-7'>
                        <h5 className='lead text-muted'>CONFLICT</h5>
                      </div>
                      <div className='col-5 text-center'>
                        <Button variant="warning" onClick={() => handleResolveConflict(parseInt(trade["id"]))}>Resolve Conflict</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          :
            <h5>No Conflicts to Show!!</h5>
      }

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Resolve Conflict</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>
                Resolve the conflict by marking the 
                trade as SUCESSFUL or FAILED so the ETH will be transfered accordingly.
            </p>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="danger" onClick={(e) => resolveConflict(e, false)}>
            Failed
          </Button>
          <Button variant="success" onClick={(e) => resolveConflict(e, true)}>
            Successful
          </Button>
        </Modal.Footer>
      </Modal>
      
    </>
  )
}

export default Conflicts