import { HumanReferenceSurfaceFlag } from "./HumanReferenceSurfaceFlag";

/**
 * Flagged reference vertices in a uniform grid, for the one neighbourhood
 * question the comparison asks: whether a reference patch of a given sign
 * already shows a generated vertex's deviation nearby.
 */
export class HumanReferenceSurfaceGrid {
  /** Flagged vertices by grid cell. */
  private readonly cells: Map<number, number[]> = new Map();

  /** Every flagged vertex, for searches wider than the grid holds. */
  private readonly all: number[] = [];

  /**
   * @param P Flat reference vertex positions, mm.
   * @param flag Flag code of every vertex; only flagged ones are kept.
   * @param size Cell edge, mm.
   */
  public constructor(
    private readonly P: Float64Array,
    private readonly flag: Uint8Array,
    private readonly size: number,
  ) {
    for (let v: number = 0; v < flag.length; v++) {
      if (flag[v] === 0) continue;
      this.all.push(v);

      const key: number = this.key(
        Math.floor(P[3 * v]! / size),
        Math.floor(P[3 * v + 1]! / size),
        Math.floor(P[3 * v + 2]! / size),
      );
      const list: number[] | undefined = this.cells.get(key);
      if (list === undefined) this.cells.set(key, [v]);
      else list.push(v);
    }
  }

  /**
   * Whether a vertex flagged with the sign, or flagged missing, lies within a
   * radius of a point.
   *
   * @param x X of the point, mm.
   * @param y Y of the point, mm.
   * @param z Z of the point, mm.
   * @param radius Search radius, mm.
   * @param sign The flag code to look for, outside or inside.
   */
  public within(x: number, y: number, z: number, radius: number, sign: number): boolean {
    const test: (v: number) => boolean = (v: number): boolean =>
      (this.flag[v] === sign || this.flag[v] === HumanReferenceSurfaceFlag.MISSING) &&
      (this.P[3 * v]! - x) ** 2 + (this.P[3 * v + 1]! - y) ** 2 + (this.P[3 * v + 2]! - z) ** 2 <= radius * radius;

    // A radius that spans more cells than exist is cheaper to answer by scanning every flagged vertex.
    const span: number = Math.ceil(radius / this.size);
    if ((2 * span + 1) ** 3 > this.cells.size) return this.all.some(test);

    const i: number = Math.floor(x / this.size);
    const j: number = Math.floor(y / this.size);
    const k: number = Math.floor(z / this.size);
    for (let a: number = i - span; a <= i + span; a++)
      for (let b: number = j - span; b <= j + span; b++)
        for (let c: number = k - span; c <= k + span; c++) {
          const list: number[] | undefined = this.cells.get(this.key(a, b, c));
          if (list !== undefined && list.some(test)) return true;
        }

    return false;
  }

  /**
   * A cell's key. Cells are offset by 500 and packed in base 1000, which holds
   * 500 cells either side of the origin, far beyond a body at 10 mm cells.
   *
   * @param a Cell index along X.
   * @param b Cell index along Y.
   * @param c Cell index along Z.
   */
  private key(a: number, b: number, c: number): number {
    return (a + 500) * 1e6 + (b + 500) * 1e3 + (c + 500);
  }
}
