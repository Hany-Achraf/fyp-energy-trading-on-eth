const mongoose = require('mongoose')
const Web3 = require('web3')
const EnerygTradingContract = require('../client/src/contracts/EnergyTrading.json')

const main = async () => {
    try {
        // initialize web3 and connecting to the smaty contract
        const web3 = new Web3('ws://127.0.0.1:7545');

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = EnerygTradingContract.networks[networkId];
        const contract = new web3.eth.Contract(
            EnerygTradingContract.abi,
            deployedNetwork && deployedNetwork.address,
        );

        // Connect to the mongodb
        const mongoDBUrl = 'mongodb://localhost/fyp_energy_trading_web2'
        await mongoose.connect(mongoDBUrl);

        const ClosedTrade = mongoose.model('ClosedTrade', new mongoose.Schema({}, { strict: false }), 'closed_trades');
        const data = await ClosedTrade.findOne().sort('-blockNumber').select({blockNumber:1,_id:0});
        const biggestBlockNumber = data === null || data['blockNumber'] === undefined ? -1 : data['blockNumber'];
        
        console.log(`Biggest Block Number: ${biggestBlockNumber}`);

        // sync between the DB and blockchain by updating the DB with the events 
        // that have been emitted when the listener was shut down
        contract.getPastEvents('TradeClosed', {fromBlock: biggestBlockNumber + 1, toBlock: 'latest'})
            .then((events) => {
                events.forEach(async (event) => {
                    const res = await ClosedTrade.create({
                        tradeId: event['returnValues']['trade']['id'],
                        buyer: event['returnValues']['trade']['buyer'],
                        seller: event['returnValues']['trade']['seller'],
                        amountEnergyNeeded: event['returnValues']['trade']['amountEnergyNeeded'],
                        sellingPrice: event['returnValues']['trade']['sellingPrice'],
                        numOfMins: event['returnValues']['trade']['numOfMins'],
                        bidAt: event['returnValues']['trade']['bidAt'],
                        biddingEndedAt: event['returnValues']['trade']['biddingEndedAt'],
                        status: event['returnValues']['trade']['status'],
                        blockNumber: event['blockNumber']
                    });
                    console.log(res);
                })
            })
            .catch(err => console.log(err))

        // start listening to the new events emitted in the BC and update the DB with it
        web3.eth.getBlockNumber().then((latestBlockNumber) => {
            contract.events.TradeClosed({fromBlock: latestBlockNumber + 1})
                .on('data', async (event) => {
                    const res = await ClosedTrade.create({
                        tradeId: event['returnValues']['trade']['id'],
                        buyer: event['returnValues']['trade']['buyer'],
                        seller: event['returnValues']['trade']['seller'],
                        amountEnergyNeeded: event['returnValues']['trade']['amountEnergyNeeded'],
                        sellingPrice: event['returnValues']['trade']['sellingPrice'],
                        numOfMins: event['returnValues']['trade']['numOfMins'],
                        bidAt: event['returnValues']['trade']['bidAt'],
                        biddingEndedAt: event['returnValues']['trade']['biddingEndedAt'],
                        status: event['returnValues']['trade']['status'],
                        blockNumber: event['blockNumber']
                    });
                    console.log(res);
                })
                .on('error', err => console.log(err))
        });
    } catch (err) {
        console.error(err);
    }
}

main()
