/**
 * Disjoint sets over `0 .. size - 1`, merged by `join` and read back as
 * groups of members. It carries every connected patch of triangles, edges and
 * corners the integrity audit reports.
 */
export class HumanSkinIntegrityUnion {
  /** Parent of every member; a root is its own parent. */
  private readonly parent: Int32Array;

  /** Sets of `size` singleton members. */
  public constructor(size: number) {
    this.parent = Int32Array.from(
      { length: size },
      (_: unknown, k: number): number => k,
    );
  }

  /** The root of a member's set, halving the path on the way. */
  public find(x: number): number {
    let at: number = x;

    while (this.parent[at] !== at) {
      this.parent[at] = this.parent[this.parent[at]!]!;
      at = this.parent[at]!;
    }

    return at;
  }

  /** Merges the sets of two members. */
  public join(x: number, y: number): void {
    const a: number = this.find(x);
    const b: number = this.find(y);

    if (a !== b) this.parent[a] = b;
  }

  /** The members of every set, each as a list of members in increasing order. */
  public groups(): number[][] {
    const out: Map<number, number[]> = new Map();

    for (let k: number = 0; k < this.parent.length; k++) {
      const root: number = this.find(k);
      const group: number[] | undefined = out.get(root);

      if (group === undefined) out.set(root, [k]);
      else group.push(k);
    }

    return [...out.values()];
  }
}
