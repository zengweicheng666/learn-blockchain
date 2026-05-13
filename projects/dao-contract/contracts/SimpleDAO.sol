// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Address.sol";
import "./VoteToken.sol";

/**
 * @title SimpleDAO
 * @notice 简易 DAO 治理合约，支持提案创建、投票和执行
 *
 * 流程：
 * 1. 代币持有者将投票权委托给自己或他人（VoteToken.delegate）
 * 2. 拥有 >= proposalThreshold 投票权者可创建提案
 * 3. 投票期内代币持有者投票（支持/反对/弃权）
 * 4. 投票结束后，赞成 > 反对 即可执行提案
 */
contract SimpleDAO {
    using Address for address;

    VoteToken public immutable voteToken;
    uint256 public votingPeriod; // 区块数
    uint256 public quorum; // 最低参与投票的票数（代币总量百分比 * 100）
    uint256 public proposalThreshold; // 创建提案所需的最低投票权

    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed,
        Canceled
    }

    struct Proposal {
        address proposer;
        address target;
        uint256 value;
        bytes data;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
    }

    Proposal[] private _proposals;

    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    constructor(
        address _voteToken,
        uint256 _votingPeriod,
        uint256 _quorum,
        uint256 _proposalThreshold
    ) {
        voteToken = VoteToken(_voteToken);
        votingPeriod = _votingPeriod;
        quorum = _quorum;
        proposalThreshold = _proposalThreshold;
    }

    // ── 提案数 ──────────────────────────────────────────

    function proposalCount() external view returns (uint256) {
        return _proposals.length;
    }

    function proposals(
        uint256 proposalId
    )
        external
        view
        returns (
            address proposer,
            address target,
            uint256 value,
            bytes memory data,
            string memory description,
            uint256 startBlock,
            uint256 endBlock,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool executed,
            bool canceled
        )
    {
        Proposal storage p = _proposals[proposalId];
        return (
            p.proposer,
            p.target,
            p.value,
            p.data,
            p.description,
            p.startBlock,
            p.endBlock,
            p.forVotes,
            p.againstVotes,
            p.abstainVotes,
            p.executed,
            p.canceled
        );
    }

    // ── 创建提案 ──────────────────────────────────────

    function propose(
        address target,
        uint256 value,
        bytes calldata data,
        string calldata description
    ) external returns (uint256) {
        require(
            voteToken.getVotes(msg.sender) >= proposalThreshold,
            "Below proposal threshold"
        );

        uint256 proposalId = _proposals.length;
        _proposals.push(
            Proposal({
                proposer: msg.sender,
                target: target,
                value: value,
                data: data,
                description: description,
                startBlock: block.number,
                endBlock: block.number + votingPeriod,
                forVotes: 0,
                againstVotes: 0,
                abstainVotes: 0,
                executed: false,
                canceled: false
            })
        );

        emit ProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }

    // ── 投票 ──────────────────────────────────────────

    function vote(
        uint256 proposalId,
        uint8 support
    ) external {
        // support: 0 = 反对, 1 = 赞成, 2 = 弃权
        require(support <= 2, "Invalid support");

        Proposal storage p = _proposals[proposalId];
        require(block.number > p.startBlock, "Voting not started");
        require(block.number <= p.endBlock, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = voteToken.getPastVotes(
            msg.sender,
            p.startBlock - 1
        );
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;

        if (support == 0) {
            p.againstVotes += weight;
        } else if (support == 1) {
            p.forVotes += weight;
        } else {
            p.abstainVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    // ── 执行提案 ──────────────────────────────────────

    function execute(uint256 proposalId) external {
        Proposal storage p = _proposals[proposalId];
        require(block.number >= p.endBlock, "Voting not ended");
        require(!p.executed, "Already executed");
        require(!p.canceled, "Canceled");

        ProposalState state = getState(proposalId);
        require(state == ProposalState.Succeeded, "Not succeeded");

        p.executed = true;
        p.target.functionCallWithValue(p.data, p.value);

        emit ProposalExecuted(proposalId);
    }

    // ── 取消提案 ──────────────────────────────────────

    function cancel(uint256 proposalId) external {
        Proposal storage p = _proposals[proposalId];
        require(msg.sender == p.proposer, "Not proposer");
        require(!p.executed, "Already executed");
        require(!p.canceled, "Already canceled");

        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // ── 查询 ──────────────────────────────────────────

    function getState(
        uint256 proposalId
    ) public view returns (ProposalState) {
        Proposal storage p = _proposals[proposalId];

        if (p.canceled) return ProposalState.Canceled;
        if (p.executed) return ProposalState.Executed;
        if (block.number <= p.startBlock) return ProposalState.Pending;
        if (block.number <= p.endBlock) return ProposalState.Active;

        // 投票结束
        if (p.forVotes <= p.againstVotes) return ProposalState.Defeated;
        if (p.forVotes + p.againstVotes < quorum) return ProposalState.Defeated;
        return ProposalState.Succeeded;
    }
}
