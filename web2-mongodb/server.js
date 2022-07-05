const mongoose = require('mongoose')

// Connect to the mongodb
mongoose.connect('mongodb://localhost/FYP_ENERGY_TRADING_WEB2').then(() => {
    const ClosedTrade = mongoose.model('ClosedTrade', new mongoose.Schema({}, { strict: false }), 'closed_trades')

    const express = require('express')
    const cors = require('cors')
    const app = express()
    app.use(cors())
    const port = 5000

    app.get('/', async (req, res) => {
      res.send(await ClosedTrade.find().sort({_id:-1}))
    })
    
    app.listen(port, () => {
      console.log(`Web 2.0 server running on port ${port}`)
    })
})