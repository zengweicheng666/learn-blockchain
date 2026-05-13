// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMarketplace.sol";
import "./abstract/PlatformFee.sol";

contract NFTMarketplace is IMarketplace, PlatformFee, ReentrancyGuard {
    uint256 private _listingIdCounter;
    mapping(uint256 => Listing) private _listings;

    constructor(uint256 _initialFee) PlatformFee(_initialFee) {}

    function listItem(address nftContract, uint256 tokenId, uint256 price) external override returns (uint256 listingId) {
        require(price > 0, "Price must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        _listingIdCounter++;
        listingId = _listingIdCounter;

        _listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit Listed(listingId, msg.sender, nftContract, tokenId, price);
    }

    function buyItem(uint256 listingId) external override payable nonReentrant {
        Listing storage listing = _listings[listingId];
        require(listing.active, "Not active");
        require(listing.seller != msg.sender, "Cannot buy own item");

        (uint256 fee, uint256 netAmount) = calculateFee(listing.price);
        require(msg.value >= listing.price + fee, "Insufficient payment");

        listing.active = false;
        accumulatedFees += fee;

        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        payable(listing.seller).transfer(netAmount);

        uint256 excess = msg.value - listing.price - fee;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        emit Bought(listingId, msg.sender, listing.seller, listing.price, fee);
    }

    function cancelListing(uint256 listingId) external override {
        Listing storage listing = _listings[listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.active, "Not active");

        listing.active = false;
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingCancelled(listingId);
    }

    function getListing(uint256 listingId) external view override returns (Listing memory) {
        return _listings[listingId];
    }

    function listingCount() external view override returns (uint256) {
        return _listingIdCounter;
    }
}
