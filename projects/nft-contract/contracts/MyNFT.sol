// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MyNFT
 * @notice ERC721 NFT 合约，支持白名单铸造和公开销售
 *
 * 功能：
 * - safeMint：白名单/公开铸造
 * - maxSupply：最大供应量限制
 * - whitelistMint：白名单地址可提前 mint
 * - publicSaleMint：公开销售阶段可 mint（需支付 ETH）
 * - tokenURI：元数据 URI
 * - withdraw：owner 提取合约中的 ETH
 */
contract MyNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant PUBLIC_SALE_PRICE = 0.01 ether;
    uint256 public constant MAX_PER_WALLET = 5;

    uint256 private _nextTokenId;
    bool public publicSaleActive;
    string private _baseTokenURI;

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public mintedPerWallet;

    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event PublicSaleToggled(bool active);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        _baseTokenURI = baseURI_;
        _nextTokenId = 1;
    }

    // ── 修改器 ───────────────────────────────────────────

    modifier whenPublicSaleActive() {
        require(publicSaleActive, "Public sale not active");
        _;
    }

    // ── 白名单管理 ──────────────────────────────────────

    function addToWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = true;
            emit WhitelistAdded(accounts[i]);
        }
    }

    function removeFromWhitelist(address account) external onlyOwner {
        whitelist[account] = false;
        emit WhitelistRemoved(account);
    }

    // ── 销售控制 ────────────────────────────────────────

    function togglePublicSale() external onlyOwner {
        publicSaleActive = !publicSaleActive;
        emit PublicSaleToggled(publicSaleActive);
    }

    // ── 铸造 ────────────────────────────────────────────

    function whitelistMint() external {
        require(whitelist[msg.sender], "Not in whitelist");
        require(totalSupply() < MAX_SUPPLY, "Sold out");
        require(mintedPerWallet[msg.sender] < MAX_PER_WALLET, "Max per wallet reached");

        mintedPerWallet[msg.sender]++;
        _safeMint(msg.sender, _nextTokenId++);
    }

    function publicSaleMint() external payable whenPublicSaleActive {
        require(msg.value >= PUBLIC_SALE_PRICE, "Insufficient ETH");
        require(totalSupply() < MAX_SUPPLY, "Sold out");
        require(mintedPerWallet[msg.sender] < MAX_PER_WALLET, "Max per wallet reached");

        mintedPerWallet[msg.sender]++;
        _safeMint(msg.sender, _nextTokenId++);
    }

    function reserveMint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");

        for (uint256 i = 0; i < amount; i++) {
            _safeMint(to, _nextTokenId++);
        }
    }

    // ── 查询 ────────────────────────────────────────────

    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return bytes(_baseTokenURI).length > 0
            ? string(abi.encodePacked(_baseTokenURI, tokenId.toString(), ".json"))
            : "";
    }

    // ── 提款 ────────────────────────────────────────────

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
