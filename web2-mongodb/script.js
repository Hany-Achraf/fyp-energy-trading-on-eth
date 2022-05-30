const mongoose = require('mongoose')
const Web3 = require('web3')
const EnerygTradingContract = require('../client/src/contracts/EnergyTrading.json')

const url = 'mongodb://localhost/fyp_energy_trading_web2'

const main = async () => {
    try {
        await mongoose.connect(url);
        console.log(`MongoDB Connected: ${url}`);

        const Trade = mongoose.model('Trade', new mongoose.Schema({}, { strict: false }), 'closed_trades');
        // const record = new Record({ name: "Hany Ashraf Mohamed", age:24, dob: new Date(Date.now()) });
        // await record.save();
        // console.log(record);


        // initialize web3 and connecting to the smaty contract
        const web3 = new Web3('ws://127.0.0.1:7545')

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = EnerygTradingContract.networks[networkId];
        const contract = new web3.eth.Contract(
            EnerygTradingContract.abi,
            deployedNetwork && deployedNetwork.address,
        );

        const lastBlockNumberInDB = -1

        // sync between the DB and blockchain by updating the DB with the events 
        // that have been emitted when the listener was shut down
        contract.getPastEvents('TradeClosed', {fromBlock: lastBlockNumberInDB + 1, toBlock: 'latest'})
            .then((events) => {
                events.forEach(async (event) => {
                    console.log(event['returnValues'])
                })
            })
            .catch(err => console.log(err))

        // start listening to the new events emitted in the BC and update the DB with it
        web3.eth.getBlockNumber().then((latestBlockNumber) => {
            contract.events.TradeClosed({fromBlock: latestBlockNumber + 1})
                .on('data', async (event) => {
                    console.log(event['returnValues'])
                })
                .on('error', err => console.log(err))
        });
    } catch (err) {
        console.error(err);
    }
}

main()
