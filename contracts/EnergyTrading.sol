// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

enum Status { RUNNING, CANCELED, PENDING_BUYER_CONFIRMATION, PENDING_SELLER_CONFIRMATION, CONFLICT, SUCCESSFUL, FAILED }

struct Trade {
    uint id; 
    address buyer;
    uint amountEnergyNeeded;
    uint numOfMins;
    uint sellingPrice;
    address seller;
    uint bidAt;
    uint biddingEndedAt;
    uint markedFailedAt;
    Status status;
}

contract EnergyTrading {
    address private admin;
    constructor() { admin = msg.sender; }
    function getAdminAddress() external view returns(address) {
        return admin;
    }
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin is allowed to perform this action!");
        _;
    }
    
    // variable holding the state of the smart contract
    Trade[] private openedTrades;
    uint private currentNumOfAllTrades;

    // event triggered whenever a trade is closed
    event TradeClosed(Trade trade);

    // private functions (only to be used by other SC functions)
    function findTrade(uint _id) private view returns(uint) {
        uint i = 0;
        for (; i < openedTrades.length; i++) {
            if (openedTrades[i].id == _id) {
                break;
            }      
        }
        return i;
    }
    
    function removeFromOpenedTrades(uint _index) private {
        openedTrades[_index] = openedTrades[openedTrades.length - 1];
        openedTrades.pop();
    }

    // External functions
    function fetchAllOpenedTrades() external view returns(Trade[] memory) { return openedTrades; }
    function createTrade(uint _amountEnergyNeeded, uint _numOfMins) external payable {
        require(msg.value == 5000000000000000000, "You must send a value of 5 ETH as deposit!");
        Trade memory newTrade;
        newTrade.id = currentNumOfAllTrades++;
        newTrade.buyer = msg.sender;
        newTrade.amountEnergyNeeded = _amountEnergyNeeded;
        newTrade.numOfMins = _numOfMins;
        newTrade.status = Status.RUNNING;
        openedTrades.push(newTrade);
    }

    function cancelTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You aren't allowed to perform this action");
        require(targetedTrade.status == Status.RUNNING, "The bidding has already ended");

        if (targetedTrade.seller != address(0)) {
            payable(targetedTrade.seller).transfer(7500000000000000000); // 7.5 ETH
            payable(targetedTrade.buyer).transfer(2500000000000000000); // 2.5 ETH
        } else {
            payable(targetedTrade.buyer).transfer(5000000000000000000); // 5 ETH
        }
        targetedTrade.status = Status.CANCELED;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);
    }

    function bid(uint _id, uint _price) external payable {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender != targetedTrade.buyer, "You can't bid on a trade you have created!!");
        require(targetedTrade.status == Status.RUNNING, "The bidding has already ended");
        require(targetedTrade.sellingPrice == 0 || targetedTrade.sellingPrice > _price, "There is already a lower or equal bid!");
        require(msg.value == 5000000000000000000, "You must send a value of 5 ETH as deposit!");

        if (targetedTrade.seller != address(0)) {
            payable(targetedTrade.seller).transfer(5000000000000000000); // 5 ETH (deposit)
        }
        targetedTrade.sellingPrice = _price;
        targetedTrade.seller = msg.sender;
        targetedTrade.bidAt = block.timestamp;
    }

    function withdrawBid(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.seller, "You aren't allowed to perform this action");
        require(targetedTrade.status == Status.RUNNING, "The bidding has already ended");
        require(block.timestamp >= targetedTrade.bidAt + 60, "You can withdraw your bid ONLY if the creator of this trade doesn't end bidding within 1 minute from the time you successfully placed your bid");

        payable(targetedTrade.seller).transfer(7500000000000000000); // 7.5 ETH
        payable(targetedTrade.buyer).transfer(2500000000000000000); // 2.5 ETH
        targetedTrade.status = Status.CANCELED;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);
    }

    function endBidding(uint _id) external payable {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You aren't allowed to perform this action");
        require(targetedTrade.seller != address(0), "You cannot end bidding if you haven't received any bid. Use \"Cancel\" instead");
        require(targetedTrade.status == Status.RUNNING, "The bidding has already ended");
        require(msg.value == targetedTrade.sellingPrice, "You must transfer the money in advance");

        targetedTrade.sellingPrice = msg.value;
        targetedTrade.biddingEndedAt = block.timestamp;
        targetedTrade.status = Status.PENDING_BUYER_CONFIRMATION;        
        /** We may emit an event here, if we want to notify an IoT component that is listening to this kind of event to act accordingly (Start tranfering energy!) */
    }

    function buyerConfirmSuccessfulTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_BUYER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");

        payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + 5000000000000000000); // selling price + 5 ETH (deposit)
        payable(targetedTrade.buyer).transfer(5000000000000000000); // 5 ETH (deposit)
        targetedTrade.status = Status.SUCCESSFUL;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);       
    }

    function buyerMarkFailedTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_BUYER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");

        targetedTrade.markedFailedAt = block.timestamp;
        targetedTrade.status = Status.PENDING_SELLER_CONFIRMATION;
    }

    function buyerClaimMoneyBack(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_SELLER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");
        require(block.timestamp >= targetedTrade.markedFailedAt + 3 * 60, "You can claim your money back only if the seller doesn't confirm failure nor request admin's intervention within 3 minutes from the time this trade was marked as Failed by you");

        payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + 10000000000000000000); // selling price + 10 ETH (buyer's deposit + seller's deposit)
        targetedTrade.status = Status.FAILED;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);          
    }
    
    function sellerConfirmFailedTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.seller, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_SELLER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");

        payable(targetedTrade.seller).transfer(2500000000000000000); // 2.5 ETH (50% of seller deposit)
        payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + 7500000000000000000); // refund + 7.5 ETH (buyer deposit + 50% of seller deposit)
        targetedTrade.status = Status.FAILED;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);
    } 

    function sellerMarkConflict(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.seller, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_SELLER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");

        targetedTrade.status = Status.CONFLICT;
    }

    function sellerClaimMoney(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.seller, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_BUYER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");
        require(block.timestamp >= targetedTrade.biddingEndedAt + targetedTrade.numOfMins * 60 + 60, "You can claim your money back only if the buyer doesn't confirm success nor mark the trade as a failed one within one minute after the number of minutes specified in the trade starting from the time he ended the bidding");

        payable(targetedTrade.buyer).transfer(2500000000000000000); // 2.5 ETH (50% of buyer deposit)
        payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + 7500000000000000000); // selling price + 7.5 ETH (seller deposit + 50% of buyer deposit)
        targetedTrade.status = Status.SUCCESSFUL;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);
    }

    function adminResolveConflict(uint _id, bool _isSuccessfulTrade) onlyAdmin external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(targetedTrade.status == Status.CONFLICT, "The current status of the trade doesn't permit you to perform this action");
        
        if (_isSuccessfulTrade) {
            payable(admin).transfer(2500000000000000000); // 2.5 ETH (50% of buyer deposit)
            payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + 7500000000000000000); // selling price + 7.5 ETH (seller deposit + 50% of buyer deposit)
            targetedTrade.status = Status.SUCCESSFUL;
        } else {
            payable(admin).transfer(2500000000000000000); // 2.5 ETH (50% of seller deposit)
            payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + 7500000000000000000); // refund + 7.5 ETH (buyer deposit + 50% of seller deposit)
            targetedTrade.status = Status.FAILED;
        }
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);
    }
}


// require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted.");

