// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

enum Status { RUNNING, CANCELED, PENDING_BUYER_CONFIRMATION, PENDING_SELLER_CONFIRMATION, CONFLICT, SUCCESSFUL, FAILED }

struct Trade {
    uint id; 
    address buyer;
    uint amountEnergyNeeded;
    uint numOfMins; // uint numOfHours;
    uint sellingPrice;
    address seller;
    uint bidAt;
    uint biddingEndedAt;
    Status status;
}

contract EnergyTrading {
    address public admin;
    constructor() { admin = msg.sender; }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin is allowed to perform this action!");
        _;
    }

    Trade[] internal openedTrades;
    uint internal currentNumOfAllTrades;

    event TradeClosed(Trade trade);

    function createTrade(uint _amountEnergyNeeded, uint _numOfMins) external payable { // _numOfHours
        require(msg.value == 100000000000000000, "You must send a value of 0.1 ETH as deposit!");
        Trade memory newTrade;
        newTrade.id = currentNumOfAllTrades++;
        newTrade.buyer = msg.sender;
        newTrade.amountEnergyNeeded = _amountEnergyNeeded;
        newTrade.numOfMins = _numOfMins; // newTrade.numOfHours = _numOfHours;
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
            payable(targetedTrade.seller).transfer(150000000000000000); // 0.15 ETH
            payable(targetedTrade.buyer).transfer(50000000000000000); // 0.05 ETH
        } else {
            payable(targetedTrade.buyer).transfer(100000000000000000); // 0.1 ETH
        }
        targetedTrade.status = Status.CANCELED;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);

        require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted.");
    }

    function bid(uint _id, uint _price) external payable {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender != targetedTrade.buyer, "You can't bid on a trade you have created!!");
        require(targetedTrade.status == Status.RUNNING, "The bidding has already ended");
        require(targetedTrade.sellingPrice == 0 || targetedTrade.sellingPrice > _price, "There is already a lower or equal bid!");
        require(msg.value == 100000000000000000, "You must send a value of 0.1 ETH as deposit!");

        if (targetedTrade.seller != address(0)) {
            payable(targetedTrade.seller).transfer(100000000000000000); // 0.1 ETH (deposit)
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
        require(block.timestamp >= targetedTrade.bidAt + 20, "You can withdraw your bid ONLY if the creator of this trade doesn't end bidding within 1 minute from the time you successfully placed your bid");

        payable(targetedTrade.seller).transfer(150000000000000000); // 0.15 ETH
        payable(targetedTrade.buyer).transfer(50000000000000000); // 0.05 ETH
        targetedTrade.status = Status.CANCELED;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);

        require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted.");
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

        payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + 100000000000000000); // selling price + 0.1 ETH (deposit)
        payable(targetedTrade.buyer).transfer(100000000000000000); // 0.1 ETH (deposit)
        targetedTrade.status = Status.SUCCESSFUL;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);

        require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted.");        
    }

    function buyerMarkFailedTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_BUYER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");
        // require(block.timestamp >= targetedTrade.timeBiddingEnded + targetedTrade.numOfHours * 60 * 60, "You can't mark a trade as FAILED before the number of hours specified in the trade starting from the time you ended the bidding");
        require(block.timestamp >= targetedTrade.biddingEndedAt + targetedTrade.numOfMins * 60, "You can't mark a trade as FAILED before the number of minutes specified in the trade starting from the time you ended the bidding");

        targetedTrade.status = Status.PENDING_SELLER_CONFIRMATION;
    }

    function buyerClaimMoneyBack(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_SELLER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");
        // require(block.timestamp >= targetedTrade.timeBiddingEnded + 72 * 60 * 60, "You can claim your money back only if the seller doesn't confirm failure nor request admin's intervention within 3 days from the time he won the bidding");
        require(block.timestamp >= targetedTrade.biddingEndedAt + 3 * 60, "You can claim your money back only if the seller doesn't confirm failure nor request admin's intervention within 3 minutes from the time he won the bidding");

        payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + 200000000000000000); // 0.2 ETH (deposit of both buyer + seller)
        targetedTrade.status = Status.FAILED;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);

        require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted.");           
    }

    function sellerConfirmFailedTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.seller, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_SELLER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");

        payable(targetedTrade.seller).transfer(50000000000000000); // 0.05 ETH (50% of seller deposit)
        payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + 150000000000000000); // refund + 0.15 ETH (buyer deposit + 50% of seller deposit)
        targetedTrade.status = Status.FAILED;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);

        require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted."); 
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
        // require(block.timestamp >= targetedTrade.timeBiddingEnded + targetedTrade.numOfHours * 60 * 60, "You can claim your money back only if the buyer doesn't confirm success nor mark the trade as a failed one within the number of hours specified in the trade starting from the time he ended the bidding");
        require(block.timestamp >= targetedTrade.biddingEndedAt + targetedTrade.numOfMins * 60, "You can claim your money back only if the buyer doesn't confirm success nor mark the trade as a failed one within the number of minutes specified in the trade starting from the time he ended the bidding");

        payable(targetedTrade.buyer).transfer(50000000000000000); // 0.05 ETH (50% of buyer deposit)
        payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + 150000000000000000); // selling price + 0.15 ETH (seller deposit + 50% of buyer deposit)
        targetedTrade.status = Status.SUCCESSFUL;
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);

        require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted."); 
    }

    function adminResolveConflict(uint _id, bool _isSuccessfulTrade) onlyAdmin external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found (Most probably it's no longer opened, check closed trades!)");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(targetedTrade.status == Status.CONFLICT, "The current status of the trade doesn't permit you to perform this action");
        
        if (_isSuccessfulTrade) {
            payable(admin).transfer(50000000000000000); // 0.05 ETH (50% of buyer deposit)
            payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + 150000000000000000); // selling price + 0.15 ETH (seller deposit + 50% of buyer deposit)
            targetedTrade.status = Status.SUCCESSFUL;
        } else {
            payable(admin).transfer(50000000000000000); // 0.05 ETH (50% of seller deposit)
            payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + 150000000000000000); // refund + 0.15 ETH (buyer deposit + 50% of seller deposit)
            targetedTrade.status = Status.FAILED;
        }
        emit TradeClosed({trade: targetedTrade});
        removeFromOpenedTrades(tradeIndex);

        require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted.");
    }

    function findTrade(uint _id) internal view returns(uint) {
        uint i = 0;
        for (; i < openedTrades.length; i++) {
            if (openedTrades[i].id == _id) {
                break;
            }      
        }
        return i;
    }

    function removeFromOpenedTrades(uint _index) internal {
        openedTrades[_index] = openedTrades[openedTrades.length - 1];
        openedTrades.pop();
    }

    /* Show contract state */

    function showContractBalance() external view returns(uint) { return address(this).balance; }

    function fetchAllOpenedTrades() external view returns(Trade[] memory) { return openedTrades; }
}
