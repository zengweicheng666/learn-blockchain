// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Auction
 * @notice ERC721 英式拍卖合约，采用 Pull over Push 退款模式
 *
 * 流程：
 * 1. 卖家部署合约，传入 NFT 地址、tokenId、起拍价、持续时间
 * 2. 卖家调用 start() 将 NFT 锁定到合约（托管），拍卖正式开始
 * 3. 竞拍者调用 bid() 出价
 * 4. 被超出的竞拍者调用 withdraw() 取回 ETH
 * 5. 拍卖结束后调用 auctionEnd() 结算
 */
contract Auction {
    // ── 拍卖配置 ──────────────────────────────────────────

    IERC721 public immutable nft;
    uint256 public immutable tokenId;
    address public immutable seller;
    uint256 public immutable startingBid;
    uint256 public immutable duration;

    // ── 拍卖状态 ──────────────────────────────────────────

    bool public started;
    uint256 public startTime;
    uint256 public endTime;
    address public highestBidder;
    uint256 public highestBid;
    bool public ended;

    // ── Pull over Push：被超出的竞拍者待提取金额 ──────────

    mapping(address => uint256) public pendingReturns;

    // ── 事件 ──────────────────────────────────────────────

    event Bid(address indexed bidder, uint256 amount);
    event Withdrawn(address indexed bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);

    // ── 修改器 ───────────────────────────────────────────

    modifier onlySeller() {
        require(msg.sender == seller, "Not seller");
        _;
    }

    modifier auctionActive() {
        require(started, "Not started");
        require(block.timestamp < endTime, "Auction ended");
        require(!ended, "Already settled");
        _;
    }

    // ── 构造函数 ──────────────────────────────────────────

    constructor(
        address _nft,
        uint256 _tokenId,
        uint256 _startingBid,
        uint256 _duration
    ) {
        nft = IERC721(_nft);
        tokenId = _tokenId;
        seller = msg.sender;
        startingBid = _startingBid;
        duration = _duration;
    }

    // ── 启动拍卖：卖家锁定 NFT 到合约 ────────────────────

    function start() external onlySeller {
        require(!started, "Already started");
        require(nft.ownerOf(tokenId) == msg.sender, "Seller does not own NFT");
        require(
            nft.getApproved(tokenId) == address(this) ||
                nft.isApprovedForAll(msg.sender, address(this)),
            "Auction not approved"
        );

        started = true;
        startTime = block.timestamp;
        endTime = block.timestamp + duration;

        nft.transferFrom(msg.sender, address(this), tokenId);
    }

    // ── 出价 ──────────────────────────────────────────────

    function bid() external payable auctionActive {
        require(msg.sender != seller, "Seller cannot bid");
        require(msg.value >= startingBid, "Below starting bid");
        require(msg.value > highestBid, "Bid too low");

        // 将前一个最高出价者的资金记入待提取（Pull 模式）
        if (highestBid != 0) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit Bid(msg.sender, msg.value);
    }

    // ── 提取退款（Pull over Push）─────────────────────────

    function withdraw() external {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit Withdrawn(msg.sender, amount);
    }

    // ── 结算拍卖 ──────────────────────────────────────────

    function auctionEnd() external {
        require(started, "Not started");
        require(block.timestamp >= endTime, "Auction not ended");
        require(!ended, "Already settled");

        ended = true;

        if (highestBidder == address(0)) {
            // 无人出价，NFT 退还给卖家
            nft.transferFrom(address(this), seller, tokenId);
        } else {
            // NFT 给最高出价者，ETH 给卖家
            nft.transferFrom(address(this), highestBidder, tokenId);
            payable(seller).transfer(highestBid);
        }

        emit AuctionEnded(highestBidder, highestBid);
    }

    // ── 取消拍卖（仅当无人出价时）────────────────────────

    function cancel() external onlySeller auctionActive {
        require(highestBid == 0, "Bids already placed");

        ended = true;
        nft.transferFrom(address(this), seller, tokenId);

        emit AuctionEnded(address(0), 0);
    }
}
