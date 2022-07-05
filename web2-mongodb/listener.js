const mongoose = require('mongoose')
const Web3 = require('web3')
const EnerygTradingContract = require('../client/src/contracts/EnergyTrading.json')

const Status = {
    '1': 'CANCELED',
    '5': 'SUCCESSFUL',
    '6': 'FAILED'
}

const main = async () => {
    try {
        // initialize web3 and connecting to the smaty contract
        const web3 = new Web3('ws://127.0.0.1:7545')

        // Get the contract instance.
        const networkId = await web3.eth.net.getId()
        const deployedNetwork = EnerygTradingContract.networks[networkId]
        const contract = new web3.eth.Contract(
            EnerygTradingContract.abi, 
            deployedNetwork && deployedNetwork.address,
        )

        // Connect to the mongodb & create model
        await mongoose.connect('mongodb://localhost/FYP_ENERGY_TRADING_WEB2')
        const ClosedTrade = mongoose.model('ClosedTrade', new mongoose.Schema({}, { strict: false }), 'closed_trades')
        
        // sync between the DB and blockchain by updating the DB with the events that have been emitted when the listener was shut down
        const data = await ClosedTrade.findOne().sort('-blockNumber').select({blockNumber:1,_id:0})
        const biggestBlockNumber = data === null || data['blockNumber'] === undefined ? -1 : data['blockNumber']
        contract.getPastEvents('TradeClosed', {fromBlock: biggestBlockNumber + 1, toBlock: 'latest'})
            .then((events) => {
                events.forEach(async (event) => {                    
                    const closedTrade = new ClosedTrade({
                        tradeId: parseInt(event['returnValues']['trade']['id']),
                        buyer: event['returnValues']['trade']['buyer'],
                        amountEnergyNeeded: parseInt(event['returnValues']['trade']['amountEnergyNeeded']),
                        numOfMins: parseInt(event['returnValues']['trade']['numOfMins']),
                        status: Status[event['returnValues']['trade']['status']],
                        blockNumber: parseInt(event['blockNumber'])
                    }) 

                    if (event['returnValues']['trade']['seller'] !== '0x0000000000000000000000000000000000000000') {
                        closedTrade.set('seller', event['returnValues']['trade']['seller'])
                        closedTrade.set('sellingPrice', parseInt(event['returnValues']['trade']['sellingPrice']))
                        closedTrade.set("bidAt", new Date(parseInt(event['returnValues']['trade']['bidAt']) * 1000))
                    }

                    if (parseInt(event['returnValues']['trade']['biddingEndedAt']) !== 0) {
                        closedTrade.set("biddingEndedAt", new Date(parseInt(event['returnValues']['trade']['biddingEndedAt']) * 1000) )
                    }

                    
                    if (parseInt(event['returnValues']['trade']['markedFailedAt']) !== 0) {
                        closedTrade.set("markedFailedAt", new Date(parseInt(event['returnValues']['trade']['markedFailedAt']) * 1000) )
                    }
                    
                    const res = await closedTrade.save()
                    console.log(res)
                })
            })
            .catch(err => console.log(err))


        // start listening to the new events emitted in the BC and update the DB with it
        web3.eth.getBlockNumber().then((latestBlockNumber) => {
            contract.events.TradeClosed({fromBlock: latestBlockNumber + 1})
                .on('data', async (event) => {
                    const closedTrade = new ClosedTrade({
                        tradeId: parseInt(event['returnValues']['trade']['id']),
                        buyer: event['returnValues']['trade']['buyer'],
                        amountEnergyNeeded: parseInt(event['returnValues']['trade']['amountEnergyNeeded']),
                        numOfMins: parseInt(event['returnValues']['trade']['numOfMins']),
                        status: Status[event['returnValues']['trade']['status']],
                        blockNumber: parseInt(event['blockNumber'])
                    }) 

                    if (event['returnValues']['trade']['seller'] !== '0x0000000000000000000000000000000000000000') {
                        closedTrade.set('seller', event['returnValues']['trade']['seller'])
                        closedTrade.set('sellingPrice', parseInt(event['returnValues']['trade']['sellingPrice']))
                        closedTrade.set("bidAt", new Date(parseInt(event['returnValues']['trade']['bidAt']) * 1000))
                    }

                    if (parseInt(event['returnValues']['trade']['biddingEndedAt']) !== 0) {
                        closedTrade.set("biddingEndedAt", new Date(parseInt(event['returnValues']['trade']['biddingEndedAt']) * 1000) )
                    }

                    if (parseInt(event['returnValues']['trade']['markedFailedAt']) !== 0) {
                        closedTrade.set("markedFailedAt", new Date(parseInt(event['returnValues']['trade']['markedFailedAt']) * 1000) )
                    }

                    const res = await closedTrade.save()
                    console.log(res)
                })
                .on('error', err => console.log(err))
        })
    } catch (err) {
        console.error(err);
    }
}

// run the main function
main()