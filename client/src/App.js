import React, { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import EnerygTradingContract from "./contracts/EnergyTrading.json";
import getWeb3 from "./getWeb3";

import Layout from "./Layout";
import Home from "./pages/Home";
import CreateTrade from "./pages/CreateTrade";
import MyOpenedTrades from "./pages/MyOpenedTrades";
import Conflicts from "./pages/Conflicts";
import NoPage from "./pages/NoPage";
import Unauthorized from "./pages/Unauthorized";

import "./App.css";

import { Button, Container } from "react-bootstrap";

import { ImSad2 } from "react-icons/im";

import { ReactSession }  from 'react-client-session';

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
  state = { runningTrades: [], conflicts: [], myOpenedTrades: [], 
            web3: null, accounts: null, contract: null, 
            isLoading: true, isLoggedIn: false, isAdmin: false 
          }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId()
      const deployedNetwork = EnerygTradingContract.networks[networkId]
      const instance = new web3.eth.Contract(
        EnerygTradingContract.abi,
        deployedNetwork && deployedNetwork.address,
      )

      this.setState({ web3, accounts, contract: instance })

      const storedAccount = ReactSession.get("storedAccount")
      if (storedAccount !== null && storedAccount === accounts[0].toUpperCase()) {
        this.fetchAllOpenedTrades()
        this.setState({isLoggedIn: true})
        const adminAddress = await instance.methods.admin().call()
        if (adminAddress.toUpperCase() === storedAccount) {
          this.setState({isAdmin: true})
        }
      }

      window.ethereum.on('accountsChanged', function (accounts) {
        ReactSession.set("storedAccount", null);
        this.setState({isAdmin: false, isLoggedIn: false, accounts: accounts})
      }.bind(this))

    } catch (error) {
      console.error(error)
    }
    this.setState({isLoading: false})
  };

  login = async (e) => {
    e.preventDefault();
    if (this.state.accounts !== null) {
      this.fetchAllOpenedTrades()
      ReactSession.set("storedAccount", (this.state.accounts[0]).toUpperCase());
      this.setState({isLoggedIn: true});
      const adminAddress = await this.state.contract.methods.admin().call();
      if (adminAddress.toUpperCase() === (this.state.accounts[0]).toUpperCase()) {
        this.setState({isAdmin: true});
      }
    } else {
      alert("You must connect your MetaMask account first!!");
    }
  }

  logout = () => {
    ReactSession.set("storedAccount", null);
    this.setState({isAdmin: false, isLoggedIn: false})
  }

  fetchAllOpenedTrades = async () => {
    const { accounts, contract } = this.state;

    const runningTrades = [], conflicts = [], myOpenedTrades = [];
    const allOpenedTrades = await contract.methods.fetchAllOpenedTrades().call();

    allOpenedTrades.forEach(openedTrade => {
      if (openedTrade["status"] === "0")  {
        runningTrades.push(openedTrade);
      }

      if (openedTrade["status"] === "4")  {
        conflicts.push(openedTrade);
      }
      
      if (openedTrade["buyer"].toUpperCase() === accounts[0].toUpperCase() ||
          openedTrade["seller"].toUpperCase() === accounts[0].toUpperCase()) {
        myOpenedTrades.push(openedTrade);
      }
    });

    // Update state with the result.
    this.setState({ 
      runningTrades: runningTrades,
      conflicts: conflicts,
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

  buyerMarkFailedTrade = async (_id) => {
    const { accounts, contract } = this.state;
    await contract.methods.buyerMarkFailedTrade(_id).send({ from: accounts[0] })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  buyerConfirmSuccessfulTrade = async (_id) => {
    const { accounts, contract } = this.state;
    await contract.methods.buyerConfirmSuccessfulTrade(_id).send({ from: accounts[0] })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  sellerClaimMoney = async (_id) => {
    const { accounts, contract } = this.state;
    await contract.methods.sellerClaimMoney(_id).send({ from: accounts[0] })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  buyerClaimMoneyBack = async (_id) => {
    const { accounts, contract } = this.state;
    await contract.methods.buyerClaimMoneyBack(_id).send({ from: accounts[0] })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  sellerConfirmFailedTrade = async (_id) => {
    const { accounts, contract } = this.state;
    await contract.methods.sellerConfirmFailedTrade(_id).send({ from: accounts[0] })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  sellerMarkConflict = async (_id) => {
    const { accounts, contract } = this.state;
    await contract.methods.sellerMarkConflict(_id).send({ from: accounts[0] })
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

  adminResolveConflict = async (_id, _isSuccessfulTrade) => {
    const { accounts, contract } = this.state;
    await contract.methods.adminResolveConflict(_id, _isSuccessfulTrade).send({ from: accounts[0] })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  render() {
    if (this.state.isLoading) {
      return (
        <div className="container-fluid h-100">
          <div className="row h-100">
            <div className="text-center my-auto">
              <img src={require("./assets/images/load.png")} width={250} height={250} />
              <br/>
              <p className="lead">Loading Web3, accounts, and contract...</p>
            </div>
          </div>
        </div>
      );
    }

    if (!this.state.web3) {
      return (
        <div className="container-fluid h-100">
          <div className="row h-100">
            <div className="text-center my-auto">
              <p className="lead">Sorry, your browser is NOT supporting <b>Web3</b></p>
              <h1><ImSad2 /></h1>
            </div>
          </div>
        </div>
      );
    }

    if (!this.state.isLoggedIn) {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/">
              <Route path="*" element={<Navigate to="/" />} />
              <Route exact path="/" element={
                <div className="container-fluid h-100">  
                  <div className="row h-100">
                    <div className="text-center my-auto">
                      <div className="alert alert-dark mx-auto w-75" role="alert">
                        <p className="lead">Please make sure to connect your desired account on the correct network using MetaMask first!</p>
                      </div>
                      <Button variant="dark" size="lg" className="text-light justify-content-center" onClick={(e) => this.login(e)}>
                        <p className="lead d-inline">Login using MetaMask </p>
                        <img src={require("./assets/images/metamask.png")} width={40} height={40} />
                      </Button>
                    </div>
                  </div>
                </div>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      );
    }

    return (
      <BrowserRouter>
        <Routes>
          {
            this.state.isAdmin 
              ?
                <Route path="/" element={<Layout isAdmin={true} logout={this.logout} />}>
                  <Route exact path="/" element={<Navigate to="/admin" />} /> 
                  <Route path="/admin" element={<Conflicts conflicts={this.state.conflicts} adminResolveConflict={this.adminResolveConflict} />} />
                  <Route path="/my-opened-trades" element={<Unauthorized />} />
                  <Route path="*" element={<NoPage />} />
                </Route>
              :
                <Route path="/" element={<Layout isAdmin={false} logout={this.logout} />}>
                  <Route index element={<Home runningTrades={this.state.runningTrades} submitBid={this.bid} submitCreateTrade={this.createTrade} />} />
                  <Route path="my-opened-trades" element={<MyOpenedTrades myOpenedTrades={this.state.myOpenedTrades} myAddress={this.state.accounts[0]} isAdmin={this.state.isAdmin} actionsOnOpenedTrades={[this.cancelTrade, this.endBidding, this.withdrawBid, this.buyerMarkFailedTrade, this.buyerConfirmSuccessfulTrade, this.sellerClaimMoney, this.buyerClaimMoneyBack, this.sellerConfirmFailedTrade, this.sellerMarkConflict, this.adminResolveConflict]} />} />
                  <Route path="/admin" element={<Unauthorized />} />
                  <Route path="*" element={<NoPage />} />
                </Route>

          }
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
