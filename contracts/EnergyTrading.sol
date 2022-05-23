// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

enum Status { RUNNING, CANCELED, PENDING_BUYER_CONFIRMATION, PENDING_SELLER_CONFIRMATION, CONFLICT, SUCCESSFUL, FAILED }

struct Trade {
    uint id;
    address buyer;
    uint buyerDeposit;
    uint amountEnergyNeeded;
    // uint numOfHours;
    uint numOfMins;
    uint timeBiddingEnded;
    uint sellingPrice;
    address seller;
    uint sellerDeposit;
    Status status;
}

contract EnergyTrading {
    address public admin;
    constructor() { admin = msg.sender; }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin is allowed to perform this action!");
        _;
    }

    Trade[] public openedTrades;
    uint public currentNumOfAllTrades;

    event TradeClosed(Trade trade);

    // function createTrade(uint _amountEnergyNeeded, uint _numOfHours) external payable {
    function createTrade(uint _amountEnergyNeeded, uint _numOfMins) external payable {
        require(msg.value >= 100000000000000000, "You must send a value of 0.1 ETH at least as deposit!");
        Trade memory newTrade;
        newTrade.id = currentNumOfAllTrades++;
        newTrade.buyer = msg.sender;
        newTrade.buyerDeposit = msg.value;
        newTrade.amountEnergyNeeded = _amountEnergyNeeded;
        // newTrade.numOfHours = _numOfHours;
        newTrade.numOfMins = _numOfMins;
        newTrade.status = Status.RUNNING;
        openedTrades.push(newTrade);
    }

    function cancelTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You aren't allowed to perform this action");
        require(targetedTrade.status == Status.RUNNING, "The bidding has already ended");

        targetedTrade.status = Status.CANCELED;
        if (targetedTrade.sellerDeposit > 0) {
            payable(targetedTrade.seller).transfer(targetedTrade.sellerDeposit + targetedTrade.buyerDeposit * 40 / 100);
            payable(targetedTrade.buyer).transfer(targetedTrade.buyerDeposit * 60 / 100);
        } else {
            payable(targetedTrade.buyer).transfer(targetedTrade.buyerDeposit);
        }
        removeFromOpenedTrades(tradeIndex);
        emit TradeClosed({trade: targetedTrade});

        require(findTrade(_id) == openedTrades.length, "ERROR: Transation reverted.");
    }

    function bid(uint _id, uint _price) external payable {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender != targetedTrade.buyer, "You can't bid on a trade you have created!!");
        require(targetedTrade.status == Status.RUNNING, "The bidding has already ended");
        require(targetedTrade.sellingPrice == 0 || targetedTrade.sellingPrice > _price, "There is already a lower or equal bid!");
        if (targetedTrade.sellerDeposit > 0) {
            require(msg.value >= targetedTrade.sellerDeposit, "You must deposit some amount of ETH that is higher than or equal to current selling deposit!");
        } else {
            require(msg.value >= 100000000000000000, "You must send a value of 0.1 ETH at least as deposit!");
        }

        targetedTrade.sellingPrice = _price;
        
        address prevSeller = targetedTrade.seller;
        targetedTrade.seller = msg.sender;
        
        uint prevSellerDeposit = targetedTrade.sellerDeposit;
        targetedTrade.sellerDeposit = msg.value;

        if (prevSellerDeposit > 0) {
            payable(prevSeller).transfer(prevSellerDeposit);
        }
    }

    function endBidding(uint _id) external payable {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You aren't allowed to perform this action");
        require(targetedTrade.status == Status.RUNNING, "The bidding has already ended");
        require(msg.value == targetedTrade.sellingPrice, "You must transfer the money in advance");

        targetedTrade.sellingPrice = msg.value;
        targetedTrade.timeBiddingEnded = block.timestamp;
        targetedTrade.status = Status.PENDING_BUYER_CONFIRMATION;

        /** We may emit an event here, if we want to notify an IoT component that is listening to this kind of event to act accordingly (Start tranfering energy!) */
    }

    function buyerConfirmSuccessfulTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_BUYER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");

        targetedTrade.status = Status.SUCCESSFUL;
        removeFromOpenedTrades(tradeIndex);
        emit TradeClosed({trade: targetedTrade});

        payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + targetedTrade.sellerDeposit);
        payable(targetedTrade.buyer).transfer(targetedTrade.buyerDeposit);
    }

    function buyerMarkFailedTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_BUYER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");
        // require(block.timestamp >= targetedTrade.timeBiddingEnded + targetedTrade.numOfHours * 60 * 60, "You can't mark a trade as FAILED before the number of hours specified in the trade starting from the time you ended the bidding");
        require(block.timestamp >= targetedTrade.timeBiddingEnded + targetedTrade.numOfMins * 60, "You can't mark a trade as FAILED before the number of minutes specified in the trade starting from the time you ended the bidding");

        targetedTrade.status = Status.PENDING_SELLER_CONFIRMATION;
    }

    function buyerClaimMoneyBack(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.buyer, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_SELLER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");
        // require(block.timestamp >= targetedTrade.timeBiddingEnded + 72 * 60 * 60, "You can claim your money back only if the seller doesn't confirm failure nor request admin's intervention within 3 days from the time he won the bidding");
        require(block.timestamp >= targetedTrade.timeBiddingEnded + 3 * 60, "You can claim your money back only if the seller doesn't confirm failure nor request admin's intervention within 3 minutes from the time he won the bidding");

        targetedTrade.status = Status.FAILED;
        removeFromOpenedTrades(tradeIndex);
        emit TradeClosed({trade: targetedTrade});

        payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + targetedTrade.buyerDeposit + targetedTrade.sellerDeposit);
    }

    function sellerConfirmFailedTrade(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.seller, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_SELLER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");

        targetedTrade.status = Status.FAILED;
        removeFromOpenedTrades(tradeIndex);
        emit TradeClosed({trade: targetedTrade});

        payable(targetedTrade.seller).transfer(targetedTrade.sellerDeposit * 50 / 100);
        payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + targetedTrade.buyerDeposit + (targetedTrade.sellerDeposit * 50 / 100));
    }

    function sellerMarkConflict(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");

        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.seller, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_SELLER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");

        targetedTrade.status = Status.CONFLICT;
    }

    function sellerClaimMoney(uint _id) external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(msg.sender == targetedTrade.seller, "You're not allowed to perform this action!");
        require(targetedTrade.status == Status.PENDING_BUYER_CONFIRMATION, "The current status of the trade doesn't permit you to perform this action");
        // require(block.timestamp >= targetedTrade.timeBiddingEnded + targetedTrade.numOfHours * 60 * 60, "You can claim your money back only if the buyer doesn't confirm success nor mark the trade as a failed one within the number of hours specified in the trade starting from the time he ended the bidding");
        require(block.timestamp >= targetedTrade.timeBiddingEnded + targetedTrade.numOfMins * 60, "You can claim your money back only if the buyer doesn't confirm success nor mark the trade as a failed one within the number of minutes specified in the trade starting from the time he ended the bidding");

        targetedTrade.status = Status.SUCCESSFUL;
        removeFromOpenedTrades(tradeIndex);
        emit TradeClosed({trade: targetedTrade});

        payable(targetedTrade.buyer).transfer(targetedTrade.buyerDeposit * 50 / 100);
        payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + (targetedTrade.buyerDeposit * 50 / 100) + targetedTrade.sellerDeposit);
    }

    function adminResolveConflict(uint _id, bool _isSuccessfulTrade) onlyAdmin external {
        uint tradeIndex = findTrade(_id);
        require(tradeIndex < openedTrades.length, "Trade Not Found!");
        
        Trade storage targetedTrade = openedTrades[tradeIndex];
        require(targetedTrade.status == Status.CONFLICT, "The current status of the trade doesn't permit you to perform this action");
        
        targetedTrade.status = _isSuccessfulTrade ? Status.SUCCESSFUL : Status.FAILED;
        removeFromOpenedTrades(tradeIndex);
        emit TradeClosed({trade: targetedTrade});

        if (_isSuccessfulTrade) {
            payable(admin).transfer(targetedTrade.buyerDeposit * 50 /  100);
            payable(targetedTrade.seller).transfer(targetedTrade.sellingPrice + (targetedTrade.buyerDeposit * 50 /  100) + targetedTrade.sellerDeposit);
        } else {
            payable(admin).transfer(targetedTrade.sellerDeposit * 50 / 100);
            payable(targetedTrade.buyer).transfer(targetedTrade.sellingPrice + targetedTrade.buyerDeposit + (targetedTrade.sellerDeposit * 50 / 100));
        }
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

    ///////////////

    function showContractBalance() external view returns(uint) { return address(this).balance; }

    // *change function name*
    function getRunningTrades() external view returns(Trade[] memory) { return openedTrades; }
}
