# Week 4：NFT 铸造合约（ERC721）

## 学习目标
- 理解 ERC721 标准
- 掌握 OpenZeppelin ERC721 合约
- 实现白名单 + 公开销售铸造逻辑
- 编写完整的 Hardhat 测试

## 项目结构

```
projects/nft-contract/
├── contracts/MyNFT.sol    # ERC721 合约
├── test/MyNFT.test.js      # 15 个测试用例
├── scripts/deploy.js       # 部署脚本
├── metadata/1.json         # 元数据示例
├── hardhat.config.js       # Hardhat 配置
└── package.json            # 依赖
```

## 核心知识点

### ERC721
- `IERC721` / `IERC721Metadata`：标准接口
- `_safeMint` vs `_mint`：safeMint 会检查接收者是否为合约
- `_requireOwned`：OpenZeppelin v5 的拥有权检查
- `tokenURI`：元数据 URI 拼接

### 铸造模式
1. **白名单铸造**：`whitelist` mapping + `addToWhitelist` / `removeFromWhitelist`
2. **公开销售**：`payable` + `publicSaleActive` 开关
3. **预留铸造**：`onlyOwner` 批量铸造

### 访问控制
- `Ownable`：`onlyOwner` 修饰器
- 自定义 `whenPublicSaleActive` 修饰器

### 安全措施
- `MAX_SUPPLY = 10000`：总量上限
- `MAX_PER_WALLET = 5`：地址上限
- `PUBLIC_SALE_PRICE = 0.01 ether`：定价

## 重要发现

### Solidity 中的中文字符串
Solidity 0.8.28 不支持字符串字面量中的非 ASCII 字符，所有 require 错误消息必须使用英文。

### OpenZeppelin v5.6.1 兼容性
新版 OpenZeppelin 使用 `mcopy` 指令，需要在 `hardhat.config.js` 中设置 `evmVersion: "cancun"`。

## 运行测试

```bash
# 运行全部测试
npx hardhat test

# 指定测试文件
npx hardhat test test/MyNFT.test.js

# 显示 gas 报告
npx hardhat test --gas
```

## 测试覆盖（15 个）

| 类别 | 测试 | 状态 |
|------|------|------|
| 基本 | 名称/符号 | ✔ |
| 基本 | 初始供应量 | ✔ |
| reserveMint | owner 铸造 | ✔ |
| reserveMint | 非 owner 回滚 | ✔ |
| 白名单 | 白名单地址铸造 | ✔ |
| 白名单 | 非白名单回滚 | ✔ |
| 白名单 | 超过每地址上限回滚 | ✔ |
| 公开销售 | 未开启回滚 | ✔ |
| 公开销售 | 正常铸造 | ✔ |
| 公开销售 | ETH 不足回滚 | ✔ |
| 供应量 | 超过 MAX_SUPPLY 回滚 | ✔ |
| tokenURI | 正确返回 URI | ✔ |
| tokenURI | 不存在 token 回滚 | ✔ |
| 提款 | owner 提取 | ✔ |
| 提款 | 非 owner 回滚 | ✔ |

## 部署
- 网络：Sepolia
- 脚本：`npx hardhat run scripts/deploy.js --network sepolia`
