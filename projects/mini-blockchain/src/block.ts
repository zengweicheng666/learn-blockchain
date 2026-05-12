import { createHash } from "node:crypto";

/**
 * 区块
 *
 * 每个区块包含：
 * - index:      区块高度
 * - timestamp:  创建时间
 * - data:       承载的交易或任意数据
 * - prevHash:   上一个区块的哈希（形成链的关键）
 * - nonce:      工作量证明计数器
 * - hash:       当前区块的哈希（由区块头所有字段 + nonce 计算得出）
 */
export class Block {
  public readonly hash: string;

  constructor(
    public readonly index: number,
    public readonly timestamp: number,
    public readonly data: string,
    public readonly prevHash: string,
    public readonly nonce: number
  ) {
    this.hash = this.calculateHash();
  }

  /** 计算区块哈希（SHA256） */
  calculateHash(): string {
    return createHash("sha256")
      .update(
        `${this.index}${this.timestamp}${this.data}${this.prevHash}${this.nonce}`
      )
      .digest("hex");
  }

  /** 挖矿：递增 nonce 直到哈希满足难度条件 */
  static mine(
    index: number,
    timestamp: number,
    data: string,
    prevHash: string,
    difficulty: number
  ): Block {
    const target = "0".repeat(difficulty);
    let nonce = 0;

    while (true) {
      const hash = createHash("sha256")
        .update(`${index}${timestamp}${data}${prevHash}${nonce}`)
        .digest("hex");

      if (hash.startsWith(target)) {
        const block = new Block(index, timestamp, data, prevHash, nonce);
        console.log(
          `  ✔ 挖到区块 #${index} | nonce=${nonce} | 哈希=${block.hash.slice(0, 16)}...`
        );
        return block;
      }
      nonce++;
    }
  }
}
