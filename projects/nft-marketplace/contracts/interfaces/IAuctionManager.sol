// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAuctionManager {
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 startingBid, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event BidWithdrawn(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 winningBid, uint256 fee);

    function createAuction(address nftContract, uint256 tokenId, uint256 startingBid, uint256 duration) external returns (uint256 auctionId);
    function placeBid(uint256 auctionId) external payable;
    function withdrawBid(uint256 auctionId) external;
    function endAuction(uint256 auctionId) external;
    function auctionCount() external view returns (uint256);
}
