import React, { useState, useEffect } from 'react'
import _ from 'lodash'

const pageSize = 5

const ClosedTrades = () => {
    const [trades, setTrades] = useState([]) 
    const [paginatedTrades, setPaginatedTrades] = useState([])
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        const func = async () => {
            const res = await fetch('http://172.21.159.35:5000/')
            res.json().then((result) => {
                const fetchedTrades = []
                result.forEach(item => {
                    fetchedTrades.push({
                        tradeId: item['tradeId'],
                        buyer: item['buyer'],
                        seller: item['seller'],
                        amountEnergyNeeded: item['amountEnergyNeeded'],
                        numOfMins: item['numOfMins'],
                        sellingPrice: item['sellingPrice'],
                        status: item['status'],
                    })
                })
                setTrades(fetchedTrades)
                setPaginatedTrades(_(fetchedTrades).slice(0).take(pageSize).value())
            })
        }
        func()
    }, [])

    const pageCount = trades.length > 0 ? Math.ceil(trades.length / pageSize) : 0
    const pages = _.range(1, pageCount + 1)

    const pagination = (pageNo) => {
        setCurrentPage(pageNo)
        const startIndex = (pageNo - 1) * pageSize
        const paginatedTrades = _(trades).slice(startIndex).take(pageSize).value()
        setPaginatedTrades(paginatedTrades)
    }
    
    
    if (trades.length === 0) {
        return (
            <div className="container-fluid h-75">
                <div className="row h-100">
                    <div className="text-center my-auto">
                        <h3>No Closed Trades to Show!</h3>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='container bg-white my-4 pt-2 table-responsive'>
            <table class="table table-striped table-bordered text-nowrap">
                <thead>
                    <tr>
                        <th scope="col">Trade Id</th>
                        <th scope="col">Buyer</th>
                        <th scope="col">Seller</th>
                        <th scope="col">Amount of Energy (Watt)</th>
                        <th scope="col">Number of Minutes</th>
                        <th scope="col">Selling Price (Wei)</th>
                        <th scope="col">Status</th>

                    </tr>
                </thead>
                <tbody>
                    {
                        paginatedTrades.map(trade => {
                            return  (
                                <tr>
                                    <th scope="row">{trade["tradeId"]}</th>
                                    <td>{trade["buyer"]}</td>
                                    <td>{trade["seller"]}</td>
                                    <td>{trade["amountEnergyNeeded"]}</td>
                                    <td>{trade["numOfMins"]}</td>
                                    <td>{trade["sellingPrice"]}</td>
                                    <td className={
                                            trade["status"] === "SUCCESSFUL"
                                                ?
                                                    "font-weight-bold text-success"
                                                :
                                                    "font-weight-bold text-warning"
                                        }
                                    >
                                        {trade["status"]}
                                    </td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
            <nav className='d-flex justify-content-center'>
                <ul className='pagination'>
                    {
                        pages.map((page) => {
                            return (
                                <li className={
                                    page === currentPage
                                        ? "page-item active"    
                                        : "page-item"
                                    }
                                    onClick={() => pagination(page)}
                                >
                                    <p className='page-link'>{page}</p>
                                </li>
                            )
                        })
                    }
                </ul>
            </nav>
        </div>
    )

}

export default ClosedTrades