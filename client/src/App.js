import React, { Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import EnerygTradingContract from "./contracts/EnergyTrading.json";
import getWeb3 from "./getWeb3";


import Layout from "./Layout";
import NoPage from "./pages/NoPage";

import "./App.css";
import Home from "./pages/Home";
import CreateTrade from "./pages/CreateTrade";
import MyOpenedTrades from "./pages/MyOpenedTrades";
import { Container } from "react-bootstrap";

const extractAndAlertErrorMessage = (err) => {
  if (err["code"] === 4001) return
  if (err["code"] === -32602) {
    alert("FAILED: Please refresh after changing the account")
    return
  }
  
  var errorMessageInJson = JSON.parse(
    err.message.slice(58, err.message.length - 2)
  );
  var errorMessageToShow = errorMessageInJson.data.data[Object.keys(errorMessageInJson.data.data)[0]].reason;
  alert(`ERROR: ${errorMessageToShow}`);
}

class App extends Component {
  state = { allRunningTrades: [], myOpenedTrades: [], web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EnerygTradingContract.networks[networkId];
      const instance = new web3.eth.Contract(
        EnerygTradingContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ web3, accounts, contract: instance }, this.fetchAllOpenedTrades);
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  fetchAllOpenedTrades = async () => {
    const { accounts, contract } = this.state;

    const allRunningTrades = [], myOpenedTrades = [];
    const allOpenedTrades = await contract.methods.fetchAllOpenedTrades().call();

    console.log(allOpenedTrades);

    allOpenedTrades.forEach(openedTrade => {
      if (openedTrade["status"] === "0")  {
        allRunningTrades.push(openedTrade);
      }
      
      if (openedTrade["buyer"] === accounts[0] || openedTrade["seller"] === accounts[0]) {
        myOpenedTrades.push(openedTrade);
      }
    });

    // Update state with the result.
    this.setState({ 
      allRunningTrades: allRunningTrades,
      myOpenedTrades: myOpenedTrades,
    });
  }

  createTrade = async (_amountEnergyNeeded, _numOfMins) => {
    const { accounts, contract } = this.state;
    await contract.methods.createTrade(_amountEnergyNeeded, _numOfMins).send({ from: accounts[0], value: 100000000000000000 })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  bid = async (_id, _price) => {
    const { accounts, contract } = this.state;
    await contract.methods.bid(_id, _price).send({ from: accounts[0], value: 100000000000000000 })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  withdrawBid = async (_id) => {
    const { accounts, contract } = this.state;
    await contract.methods.withdrawBid(_id).send({ from: accounts[0] })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  cancelTrade = async (_id) => {
    const { accounts, contract } = this.state;
    await contract.methods.cancelTrade(_id).send({ from: accounts[0] })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  endBidding = async (trade) => {
    const { accounts, contract } = this.state;
    await contract.methods.endBidding(parseInt(trade["id"])).send({ from: accounts[0], value: parseInt(trade["sellingPrice"]) })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* {this.state.openedTrades.length > 0 && <Route index element={<RunningTradesList openedTrades={this.state.openedTrades} />} />} */}
            <Route index element={<Container><Home allRunningTrades={this.state.allRunningTrades} submitBid={this.bid} /></Container>} />
            <Route path="create-trade" element={<Container><CreateTrade onSubmit={this.createTrade} /></Container>} />
            <Route path="my-opened-trades" element={<Container><MyOpenedTrades myOpenedTrades={this.state.myOpenedTrades} myAddress={this.state.accounts[0]} actionsOnOpenedTrades={[this.cancelTrade, this.endBidding, this.withdrawBid]} /></Container>} />
            <Route path="*" element={<Container><NoPage /></Container>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
