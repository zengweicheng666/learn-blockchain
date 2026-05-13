// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMarketplace {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    event Listed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price);
    event Bought(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price, uint256 fee);
    event ListingCancelled(uint256 indexed listingId);

    function listItem(address nftContract, uint256 tokenId, uint256 price) external returns (uint256 listingId);
    function buyItem(uint256 listingId) external payable;
    function cancelListing(uint256 listingId) external;
    function getListing(uint256 listingId) external view returns (Listing memory);
    function listingCount() external view returns (uint256);
}
