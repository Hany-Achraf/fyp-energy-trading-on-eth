import React, { useState } from 'react'
import { Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { BsQuestionCircle } from "react-icons/bs"
import { FaEthereum } from "react-icons/fa"
import { GiElectric } from "react-icons/gi"
import { BiTime } from "react-icons/bi"


const Home = ({ runningTrades, submitBid, submitCreateTrade }) => {
  const [showBidModal, setShowBidModal] = useState(false)
  const [showCreateTradeModal, setShowCreateTradeModal] = useState(false)
  
  const [tradeId, setTradeId] = useState(-1)
  const [price, setPrice] = useState(0)
  const handleBid = (tradeId) => {
    setShowBidModal(true)
    setTradeId(tradeId)
  }
  const handleSubmitBid = (e) => {
    e.preventDefault()
    submitBid(tradeId, price)
    setShowBidModal(false)
  }

  const [amountEnergyNeeded, setAmountEnergyNeeded] = useState(0)
  const [numOfMins, setNumOfMins] = useState(0)
  const handleCreateNewTrade = () => {
    setShowCreateTradeModal(true);
  }
  const handleSubmitCreateTrade = (e) => {
    e.preventDefault()
    submitCreateTrade(amountEnergyNeeded, numOfMins)
    setShowCreateTradeModal(false)
  }

  return (
    <div className='container'>
      <div className='row align-items-center my-2'>
        <div className='col px-0'>
          <h3 className='text-muted'>List of current running trades..</h3>
        </div>
        <div className='col px-0 text-end'>
          <Button variant="success" size="lg" className="text-light" onClick={() => handleCreateNewTrade()}>Create New Trade</Button>
        </div>
      </div>
      {
        runningTrades.length > 0 
          ?
            runningTrades.map(trade => {
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
                    <div className='row align-items-center'>
                      <div className='col-7'>
                        <h5 className='text-muted'>RUNNING</h5>
                      </div>
                      <div className='col-5 text-end'>
                        <Button variant="primary" size="lg" onClick={() => handleBid(parseInt(trade["id"]))}>Bid</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          :
            <h5>No Running Trades to Show!!</h5>
      }

      {/* Create New Trade Modal*/}
      <Modal show={showCreateTradeModal} onHide={() => setShowCreateTradeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Trade</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form> 
            <Form.Group className="mb-3" controlId="amountEnergyNeeded">
              <InputGroup className="mb-3">
                <InputGroup.Text><GiElectric /></InputGroup.Text>
                <Form.Control type="text" placeholder="Enter amount of energy (in Watt)" onChange={(e) => setAmountEnergyNeeded(parseInt(e.target.value))} />
                <InputGroup.Text data-bs-toggle="tooltip" data-bs-placement="right" title="Specify the amount of energy (in Watt) that you want to buy."><BsQuestionCircle /></InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3" controlId="numOfMins">
              <InputGroup className="mb-3">
                <InputGroup.Text><BiTime /></InputGroup.Text>
                <Form.Control type="text" placeholder="Enter number of minutes" onChange={(e) => setNumOfMins(parseInt(e.target.value))} />
                <InputGroup.Text data-bs-toggle="tooltip" data-bs-placement="right" title="Specify the amount of energy (in Watt) that you want to buy."><BsQuestionCircle /></InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateTradeModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={(e) => handleSubmitCreateTrade(e)}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bidding Modal*/}
      <Modal show={showBidModal} onHide={() => setShowBidModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Place your bid</Modal.Title>
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
          <Button variant="secondary" onClick={() => setShowBidModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={(e) => handleSubmitBid(e)}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      
    </div>
  )
}

export default Home