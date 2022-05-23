import React, { Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import getWeb3 from "./getWeb3";
// import RunningTradesList from "./components/RunningTradesList";

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
      const CONTRACT_ADDRESS = '0xC38C88A1701908b4D5cb454466f0Ea068Bc6C267';
      const CONTRACT_ABI = [
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "_isSuccessfulTrade",
              "type": "bool"
            }
          ],
          "name": "adminResolveConflict",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_price",
              "type": "uint256"
            }
          ],
          "name": "bid",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            }
          ],
          "name": "buyerClaimMoneyBack",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            }
          ],
          "name": "buyerConfirmSuccessfulTrade",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            }
          ],
          "name": "buyerMarkFailedTrade",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            }
          ],
          "name": "cancelTrade",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_amountEnergyNeeded",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_numOfMins",
              "type": "uint256"
            }
          ],
          "name": "createTrade",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            }
          ],
          "name": "endBidding",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            }
          ],
          "name": "sellerClaimMoney",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            }
          ],
          "name": "sellerConfirmFailedTrade",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_id",
              "type": "uint256"
            }
          ],
          "name": "sellerMarkConflict",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "id",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "buyer",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "buyerDeposit",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "amountEnergyNeeded",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "numOfMins",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "timeBiddingEnded",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "sellingPrice",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "seller",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "sellerDeposit",
                  "type": "uint256"
                },
                {
                  "internalType": "enum Status",
                  "name": "status",
                  "type": "uint8"
                }
              ],
              "indexed": false,
              "internalType": "struct Trade",
              "name": "trade",
              "type": "tuple"
            }
          ],
          "name": "TradeClosed",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "admin",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "currentNumOfAllTrades",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getRunningTrades",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "id",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "buyer",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "buyerDeposit",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "amountEnergyNeeded",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "numOfMins",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "timeBiddingEnded",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "sellingPrice",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "seller",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "sellerDeposit",
                  "type": "uint256"
                },
                {
                  "internalType": "enum Status",
                  "name": "status",
                  "type": "uint8"
                }
              ],
              "internalType": "struct Trade[]",
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "openedTrades",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "buyerDeposit",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amountEnergyNeeded",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "numOfMins",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "timeBiddingEnded",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "sellingPrice",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "seller",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "sellerDeposit",
              "type": "uint256"
            },
            {
              "internalType": "enum Status",
              "name": "status",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "showContractBalance",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      const instance = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;

    const allRunningTrades = [], myOpenedTrades = [];
    const allOpenedTrades = await contract.methods.getRunningTrades().call();

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
    await contract.methods.createTrade(_amountEnergyNeeded).send({ from: accounts[0], value: 100000000000000000 })
      .catch(err => {
        extractAndAlertErrorMessage(err)
      });
  }

  /** ERROR: Cannot deal with big integers!! */
  bid = async (_id, _price) => {
    const { accounts, contract } = this.state;
    await contract.methods.bid(_id, _price).send({ from: accounts[0], value: 100000000000000000 })
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

    console.log(`Selling price value = ${trade["sellingPrice"]}`)

    await contract.methods.endBidding(trade["id"]).send({ from: accounts[0], value: trade["sellingPrice"] })
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
            <Route path="my-opened-trades" element={<Container><MyOpenedTrades myOpenedTrades={this.state.myOpenedTrades} myAddress={this.state.accounts[0]} actionsOnOpenedTrades={[this.cancelTrade, this.endBidding]} /></Container>} />
            <Route path="*" element={<Container><NoPage /></Container>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
