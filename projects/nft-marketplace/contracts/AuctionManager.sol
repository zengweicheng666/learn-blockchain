// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAuctionManager.sol";
import "./abstract/PlatformFee.sol";

contract AuctionManager is IAuctionManager, PlatformFee, ReentrancyGuard {
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startingBid;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool active;
        bool ended;
    }

    uint256 private _auctionIdCounter;
    mapping(uint256 => Auction) private _auctions;
    mapping(uint256 => mapping(address => uint256)) private _pendingReturns;

    constructor(uint256 _initialFee) PlatformFee(_initialFee) {}

    function createAuction(address nftContract, uint256 tokenId, uint256 startingBid, uint256 duration)
        external override returns (uint256 auctionId)
    {
        require(startingBid > 0, "Starting bid must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        _auctionIdCounter++;
        auctionId = _auctionIdCounter;

        _auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startingBid: startingBid,
            highestBidder: address(0),
            highestBid: 0,
            endTime: block.timestamp + duration,
            active: true,
            ended: false
        });

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, startingBid, block.timestamp + duration);
    }

    function placeBid(uint256 auctionId) external override payable {
        Auction storage auction = _auctions[auctionId];
        require(auction.active, "Not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(!auction.ended, "Already settled");
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(msg.value >= auction.startingBid, "Below starting bid");
        require(msg.value > auction.highestBid, "Bid too low");

        // Refund previous highest bidder (Pull pattern)
        if (auction.highestBidder != address(0)) {
            _pendingReturns[auctionId][auction.highestBidder] += auction.highestBid;
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    function withdrawBid(uint256 auctionId) external override {
        uint256 amount = _pendingReturns[auctionId][msg.sender];
        require(amount > 0, "Nothing to withdraw");

        _pendingReturns[auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit BidWithdrawn(auctionId, msg.sender, amount);
    }

    function endAuction(uint256 auctionId) external override nonReentrant {
        Auction storage auction = _auctions[auctionId];
        require(auction.active, "Not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.ended, "Already settled");

        auction.active = false;
        auction.ended = true;

        if (auction.highestBidder == address(0)) {
            // No bids — return NFT to seller
            IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionEnded(auctionId, address(0), 0, 0);
        } else {
            // Winner gets NFT, seller gets highest bid minus fee
            (uint256 fee, uint256 netAmount) = calculateFee(auction.highestBid);
            accumulatedFees += fee;

            IERC721(auction.nftContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
            payable(auction.seller).transfer(netAmount);

            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid, fee);
        }
    }

    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return _auctions[auctionId];
    }

    function getPendingReturn(uint256 auctionId, address bidder) external view returns (uint256) {
        return _pendingReturns[auctionId][bidder];
    }

    function auctionCount() external view override returns (uint256) {
        return _auctionIdCounter;
    }
}
