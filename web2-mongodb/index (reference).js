const main = async () => {
	// import packages
	const fetch = require('node-fetch');
	const Web3 = require('web3')

	// initialize web3 and connecting to the smaty contract
	const web3 = new Web3('ws://127.0.0.1:8545')
	const ABI = [
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "newFavoriteNumber",
					"type": "uint256"
				}
			],
			"name": "store",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "uint256",
					"name": "oldNumber",
					"type": "uint256"
				},
				{
					"indexed": true,
					"internalType": "uint256",
					"name": "newNumber",
					"type": "uint256"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "addedNumber",
					"type": "uint256"
				},
				{
					"indexed": false,
					"internalType": "address",
					"name": "sender",
					"type": "address"
				}
			],
			"name": "storedNumber",
			"type": "event"
		},
		{
			"inputs": [],
			"name": "favoriteNumber",
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
	]
	const CONTRACT_ADDRESS = '0x32367aDA8b5FD4b0E3e0D735B4a40719de64eB24'
	const myContract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS)
	
	// get the id of last blockNumber stored in the database
	res = await fetch('http://192.168.1.10:80/api/simple-storage/latest/')
	data = await res.json()
	lastBlockNumberInDB = data[0]['blockNumber']
	console.log(`lastBlockNumberInDB: ${lastBlockNumberInDB}`)
	
	// sync between the DB and blockchain by updating the DB with the events 
	// that have been emitted when the listener was shut down
	myContract.getPastEvents('storedNumber', {fromBlock: lastBlockNumberInDB + 1, toBlock: 'latest'})
		.then((events) => {
			events.forEach(async (event) => {
				console.log(`blockNumber: ${event['blockNumber']}`)
				console.log(event['returnValues'])
				data = {
					'oldNumber': event['returnValues']['oldNumber'],
					'newNumber': event['returnValues']['newNumber'],
					'addedNumber': event['returnValues']['addedNumber'],
					'sender': event['returnValues']['sender'],
					'blockNumber': event['blockNumber'],
				}
				res = await fetch('http://192.168.1.10:80/api/simple-storage/', {
					'method': 'POST',
					'headers': {
						'Content-type': 'application/json',
					},
					'body': JSON.stringify(data),
				})
				
				res.status === 200
					? console.log('Succeeded :)')
					: console.log('Failed :(')
			})
		})
		.catch(err => console.log(err))
	
	// start listening to the new events emitted in the BC and update the DB with it
	web3.eth.getBlockNumber().then((latestBlockNumber) => {	
		// console.log(`Latest Block Number: ${latestBlockNumber}`)
		myContract.events.storedNumber({fromBlock: latestBlockNumber + 1})
			.on('data', async (event) => {
					console.log(`blockNumber: ${event['blockNumber']}`)
					console.log(event['returnValues'])
					data = {
						'oldNumber': event['returnValues']['oldNumber'],
						'newNumber': event['returnValues']['newNumber'],
						'addedNumber': event['returnValues']['addedNumber'],
						'sender': event['returnValues']['sender'],
						'blockNumber': event['blockNumber'],
					}
					res = await fetch('http://192.168.1.10:80/api/simple-storage/', {
						'method': 'POST',
						'headers': {
							'Content-type': 'application/json',
						},
						'body': JSON.stringify(data),
					})
					
					res.status === 200
						? console.log('Succeeded :)')
						: console.log('Failed :(')
			})
			.on('error', err => console.log(err))
	});
}

// run the script
main()



// data = {
// 	'oldNumber': event['returnValues']['oldNumber'],
// 	'newNumber': event['returnValues']['newNumber'],
// 	'addedNumber': event['returnValues']['addedNumber'],
// 	'sender': event['returnValues']['sender']
// }
// res = await fetch('http://192.168.1.10:80/api/simple-storage/', {
// 	'method': 'POST',
// 	'headers': {
// 		'Content-type': 'application/json',
// 	},
// 	'body': JSON.stringify(data),
// })

// res.status === 200
// 	? console.log('Succeeded :)')
// 	: console.log('Failed :(')