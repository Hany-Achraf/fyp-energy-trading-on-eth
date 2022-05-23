import React, { useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap';
import { BsQuestionCircle } from "react-icons/bs"
import { GiElectric } from "react-icons/gi"
import { BiTime } from "react-icons/bi"
import { FaEthereum } from "react-icons/fa"

const CreateTrade = ({ onSubmit }) => {
  const [amountOfEnergy, setAmountOfEnergy] = useState(0)
  const [numOfMins, setNumOfMins] = useState(0)
  // const [deposit, setDeposit] = useState(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(amountOfEnergy, numOfMins)
  }

  return (
    <div>
        <h4>Create New Trade</h4>

        <Form> 
          <Form.Group className="mb-3" controlId="amountOfEnergy">
            <InputGroup className="mb-3">
              <InputGroup.Text><GiElectric /></InputGroup.Text>
              <Form.Control type="text" placeholder="Enter amount of energy (in Watt)" onChange={(e) => setAmountOfEnergy(parseInt(e.target.value))} />
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

          <Button variant="primary" type="submit" onClick={(e) => handleSubmit(e)}>
            Submit
          </Button>
        </Form>
    </div>
  )
}

export default CreateTrade