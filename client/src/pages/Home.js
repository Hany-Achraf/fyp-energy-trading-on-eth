import React, { useState } from 'react'
import { Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { BsQuestionCircle } from "react-icons/bs"
import { FaEthereum } from "react-icons/fa"


const Home = ({ allRunningTrades, submitBid }) => {
  const [tradeId, setTradeId] = useState(-1)
  const [price, setPrice] = useState(0)
  
  const [show, setShow] = useState(false);

  const handleBid = (tradeId) => {
    setShow(true)
    setTradeId(tradeId)
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    submitBid(tradeId, price)
    setShow(false);
  }

  return (
    <>
      {
        allRunningTrades.length > 0 
          ?
            allRunningTrades.map(trade => {
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
                      <h5 className='lead text-muted'>RUNNING</h5>
                    </div>
                    <div className='col-5 text-center'>
                      <Button variant="primary" onClick={() => handleBid(parseInt(trade["id"]))}>Bid</Button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          :
            <h5>No Running Trades to Show!!</h5>
      }

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form> 
            <Form.Group className="mb-3" controlId="price">
              <InputGroup className="mb-3">
                <InputGroup.Text><FaEthereum /></InputGroup.Text>
                <Form.Control type="text" placeholder="Enter your bid (in Wei)" onChange={(e) => setPrice(parseInt(e.target.value))} />
                <InputGroup.Text data-bs-toggle="tooltip" data-bs-placement="right" title="You must enter a cheaper selling price (in Wei) to overbid the current selling price (if any), otherwise you'll be wasting your ETH!!"><BsQuestionCircle /></InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={(e) => handleSubmit(e)}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      
    </>
  )
}

export default Home