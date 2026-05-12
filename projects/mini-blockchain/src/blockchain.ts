import { Block } from "./block";

/**
 * 区块链
 *
 * 管理区块的添加和验证。
 * 核心规则：每个新区块的 prevHash 必须等于链上最后一个区块的 hash。
 */
export class Blockchain {
  public readonly chain: Block[] = [];

  constructor(public readonly difficulty: number = 4) {
    // 创世区块：index=0, prevHash="0"
    const genesis = Block.mine(0, Date.now(), "创世区块", "0", difficulty);
    this.chain.push(genesis);
  }

  /** 获取链上最后一个区块 */
  get latestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /** 添加新区块 */
  addBlock(data: string): Block {
    const prev = this.latestBlock;
    const block = Block.mine(
      prev.index + 1,
      Date.now(),
      data,
      prev.hash,
      this.difficulty
    );
    this.chain.push(block);
    return block;
  }

  /**
   * 验证整条链的完整性
   *
   * 检查项：
   * 1. 每个区块的 prevHash 是否等于上一个区块的 hash
   * 2. 每个区块的 hash 是否正确（未被篡改）
   */
  isValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // 验证哈希链接
      if (current.prevHash !== previous.hash) {
        console.error(
          `  ✗ 区块 #${i} 的 prevHash 不匹配:\n    ${current.prevHash}\n    ${previous.hash}`
        );
        return false;
      }

      // 验证区块哈希（重新计算确认是否被篡改）
      if (current.hash !== current.calculateHash()) {
        console.error(`  ✗ 区块 #${i} 的哈希被篡改!`);
        return false;
      }
    }
    return true;
  }

  /** 篡改指定区块的数据（模拟攻击） */
  tamper(index: number, newData: string): void {
    if (index < 0 || index >= this.chain.length) {
      throw new Error("区块索引越界");
    }
    // 直接修改 data 不会更新 hash——通过这种方式模拟篡改
    (this.chain[index] as any).data = newData;
    console.log(`  ⚠ 篡改了区块 #${index} 的数据: "${newData}"`);
  }
}
