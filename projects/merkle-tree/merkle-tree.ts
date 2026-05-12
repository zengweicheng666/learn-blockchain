/**
 * MerkleTree —— 默克尔树 TypeScript 实现
 *
 * 功能：
 * - buildTree(leaves)    从叶子列表构建整棵树
 * - getRoot()            获取根哈希
 * - getProof(leaf)       生成某叶子的 Merkle Proof
 * - verifyProof(leaf, proof, root)  静态验证 Proof
 *
 * 使用 SHA256 哈希，叶子数为奇数时复制最后一个补成偶数。
 * 防第二原像攻击：叶子节点加 0x00 前缀，内部节点加 0x01 前缀。
 */

import crypto from "crypto";

export interface ProofNode {
  position: "left" | "right";
  data: string;
}

export class MerkleTree {
  private levels: string[][] = [];
  private _root: string = "";
  private leafHashMap: Map<string, number> = new Map();

  constructor(leaves: string[]) {
    if (leaves.length === 0) throw new Error("叶子列表不能为空");
    this.build(leaves);
  }

  // ── 构建 ────────────────────────────────────────────

  private build(leaves: string[]): void {
    // 第一层：叶子哈希（加 0x00 前缀防第二原像攻击）
    const leafHashes = leaves.map((d) =>
      crypto.createHash("sha256").update("\x00" + d).digest("hex")
    );
    leafHashes.forEach((h, i) => this.leafHashMap.set(h, i));
    this.levels = [leafHashes];

    // 逐层向上计算
    while (this.levels[0].length > 1) {
      const current = this.levels[0];
      const paired = this.padEven(current);
      const next: string[] = [];
      for (let i = 0; i < paired.length; i += 2) {
        next.push(this.hashPair(paired[i], paired[i + 1]));
      }
      this.levels.unshift(next);
    }

    this._root = this.levels[0][0];
  }

  // ── 公开方法 ────────────────────────────────────────

  getRoot(): string {
    return this._root;
  }

  getLeafCount(): number {
    return this.levels[this.levels.length - 1].length;
  }

  /**
   * 为某一叶子生成 Merkle Proof
   * @param leaf 原始数据（非哈希）
   * @returns Proof 路径 + 叶子在树中的索引
   */
  getProof(leaf: string): { proof: ProofNode[]; index: number } {
    const leafHash = crypto
      .createHash("sha256")
      .update("\x00" + leaf)
      .digest("hex");

    const index = this.leafHashMap.get(leafHash);
    if (index === undefined) throw new Error("叶子不在树中");

    const proof: ProofNode[] = [];
    let idx = index;

    // 从叶子层往上（levels 数组是从根到叶，所以从下往上遍历）
    for (let level = this.levels.length - 1; level > 0; level--) {
      const currentLevel = this.levels[level];
      const paired = this.padEven(currentLevel);
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

      if (siblingIdx < paired.length) {
        proof.push({
          position: idx % 2 === 0 ? "right" : "left",
          data: paired[siblingIdx],
        });
      }

      idx = Math.floor(idx / 2);
    }

    return { proof, index };
  }

  /**
   * 验证 Merkle Proof
   * @param leaf  原始数据
   * @param proof Proof 路径
   * @param root  期望的根哈希
   */
  static verifyProof(
    leaf: string,
    proof: ProofNode[],
    root: string
  ): boolean {
    let hash = crypto
      .createHash("sha256")
      .update("\x00" + leaf)
      .digest("hex");

    for (const node of proof) {
      hash =
        node.position === "left"
          ? MerkleTree.hashPair(node.data, hash)
          : MerkleTree.hashPair(hash, node.data);
    }

    return hash === root;
  }

  // ── 内部工具 ────────────────────────────────────────

  private padEven(arr: string[]): string[] {
    return arr.length % 2 === 0 ? arr : [...arr, arr[arr.length - 1]];
  }

  private static hashPair(a: string, b: string): string {
    return crypto
      .createHash("sha256")
      .update("\x01" + a + b)
      .digest("hex");
  }

  private hashPair(a: string, b: string): string {
    return MerkleTree.hashPair(a, b);
  }
}
