import type { HumanAnatomy } from "./HumanAnatomy";

/**
 * Conservative triangle candidates for parallel skin sections.
 *
 * One caller owns this index for one immutable skin, triangle region and exact
 * plane normal. Replacing positions, indices, region or normal requires a new
 * index; no process cache retains it. The existing cutter remains responsible
 * for intersections, component topology and every anatomical measurement.
 *
 * Preparation costs O(T log T), queries visit a balanced interval tree and cost
 * O(T) in the worst case when all triangles overlap. Returning K candidates in
 * the original region order costs O(K log K). Retained typed arrays occupy at
 * most 48T bytes, plus constant state. Before optimization the declared workload
 * budget is at most 25% of full-scan triangle visits for 400 sections of a
 * 200,000-triangle longitudinal surface, and at most 64 retained bytes per
 * triangle. Elapsed time is reported separately, never used as a CI oracle.
 */
export class HumanPlaneIndex {
  /** Original region triangle identifiers, including its ordering. */
  private readonly triangles: Uint32Array;

  /** Region ordinals sorted by their lowest projection. */
  private readonly order: Uint32Array;

  /** Lowest vertex projection in the sorted order. */
  private readonly low: Float64Array;

  /** Maximum upper projection in every balanced tree node. */
  private readonly high: Float64Array;

  /** First leaf in the complete tree. */
  private readonly leaves: number;

  /** Exact normal copied from the caller. */
  private readonly normal: HumanAnatomy.V3;

  /** Upper bound on the absolute terms of a vertex projection. */
  private readonly magnitude: number;

  /** Coordinate extrema detect overflow in the cutter's subtraction first. */
  private readonly minimum: HumanAnatomy.V3 = [Infinity, Infinity, Infinity];

  /** Coordinate maxima paired with the minimum, including zero-weight axes. */
  private readonly maximum: HumanAnatomy.V3 = [-Infinity, -Infinity, -Infinity];

  /** Prepare only the supplied region; malformed or overflowing data refuses. */
  public constructor(
    skin: Pick<HumanAnatomy.ISkin, "P" | "I">,
    normal: Readonly<HumanAnatomy.V3>,
    within?: Uint32Array,
  ) {
    if (skin.P.length % 3 !== 0 || skin.I.length % 3 !== 0)
      throw new RangeError("Plane index needs complete vertices and triangles");
    if (!normal.every(Number.isFinite))
      throw new RangeError("Plane normal must be finite");
    this.normal = [normal[0], normal[1], normal[2]];
    const count: number = within?.length ?? skin.I.length / 3;
    this.triangles =
      within === undefined
        ? Uint32Array.from(
            { length: count },
            (_: unknown, i: number): number => i,
          )
        : within.slice();
    const lower: Float64Array = new Float64Array(count);
    const upper: Float64Array = new Float64Array(count);
    let magnitude: number = 0;
    for (let i: number = 0; i < count; i++) {
      const triangle: number = this.triangles[i]!;
      if (triangle >= skin.I.length / 3)
        throw new RangeError("Plane region names a missing triangle");
      let lo: number = Infinity;
      let hi: number = -Infinity;
      for (let k: number = 0; k < 3; k++) {
        const vertex: number = skin.I[3 * triangle + k]!;
        if (vertex >= skin.P.length / 3)
          throw new RangeError("Plane triangle names a missing vertex");
        const x: number = skin.P[3 * vertex]!;
        const y: number = skin.P[3 * vertex + 1]!;
        const z: number = skin.P[3 * vertex + 2]!;
        const projected: number = x * normal[0] + y * normal[1] + z * normal[2];
        const terms: number =
          Math.abs(x * normal[0]) +
          Math.abs(y * normal[1]) +
          Math.abs(z * normal[2]);
        if (![x, y, z, projected, terms].every(Number.isFinite))
          throw new RangeError("Plane projection must be finite");
        for (let axis: number = 0; axis < 3; axis++) {
          const coordinate: number = skin.P[3 * vertex + axis]!;
          this.minimum[axis] = Math.min(this.minimum[axis]!, coordinate);
          this.maximum[axis] = Math.max(this.maximum[axis]!, coordinate);
        }
        lo = Math.min(lo, projected);
        hi = Math.max(hi, projected);
        magnitude = Math.max(magnitude, terms);
      }
      lower[i] = lo;
      upper[i] = hi;
    }
    this.magnitude = magnitude;
    this.order = Uint32Array.from(
      { length: count },
      (_: unknown, i: number): number => i,
    ).sort((a: number, b: number): number => lower[a]! - lower[b]! || a - b);
    this.low = Float64Array.from(this.order, (i: number): number => lower[i]!);
    let leaves: number = 1;
    while (leaves < count) leaves *= 2;
    this.leaves = leaves;
    this.high = new Float64Array(2 * leaves).fill(-Infinity);
    for (let i: number = 0; i < count; i++)
      this.high[leaves + i] = upper[this.order[i]!]!;
    for (let i: number = leaves - 1; i > 0; i--)
      this.high[i] = Math.max(this.high[2 * i]!, this.high[2 * i + 1]!);
  }

  /** Retained array bytes, excluding constant object and normal overhead. */
  public get bytes(): number {
    return (
      this.triangles.byteLength +
      this.order.byteLength +
      this.low.byteLength +
      this.high.byteLength
    );
  }

  /**
   * Return a conservative region in its original order for this plane origin.
   * Inclusive endpoints preserve vertex/edge tangencies. The padding bounds
   * subtraction, multiplication and addition roundoff in both the prepared dot
   * products and the cutter's (position-origin) dot normal. Subnormal error has
   * its own absolute allowance. An overflowing allowance returns the full region.
   */
  public query(origin: Readonly<HumanAnatomy.V3>): Uint32Array {
    if (!origin.every(Number.isFinite))
      throw new RangeError("Plane origin must be finite");
    for (let axis: number = 0; axis < 3; axis++)
      if (
        !Number.isFinite(this.minimum[axis]! - origin[axis]!) ||
        !Number.isFinite(this.maximum[axis]! - origin[axis]!)
      )
        return this.triangles.slice();
    const n: HumanAnatomy.V3 = this.normal;
    const at: number = origin[0] * n[0] + origin[1] * n[1] + origin[2] * n[2];
    const terms: number =
      Math.abs(origin[0] * n[0]) +
      Math.abs(origin[1] * n[1]) +
      Math.abs(origin[2] * n[2]);
    if (!Number.isFinite(at) || !Number.isFinite(terms))
      throw new RangeError("Plane origin projection must be finite");
    const error: number =
      32 * Number.EPSILON * (this.magnitude + terms) + 32 * Number.MIN_VALUE;
    if (!Number.isFinite(error)) return this.triangles.slice();
    const lo: number = at - error;
    const hi: number = at + error;
    const ordinals: number[] = [];
    const visit: (node: number, start: number, end: number) => void = (
      node: number,
      start: number,
      end: number,
    ): void => {
      if (
        start >= this.low.length ||
        this.low[start]! > hi ||
        this.high[node]! < lo
      )
        return;
      if (end - start === 1) {
        ordinals.push(this.order[start]!);
        return;
      }
      const middle: number = (start + end) / 2;
      visit(2 * node, start, middle);
      visit(2 * node + 1, middle, end);
    };
    visit(1, 0, this.leaves);
    ordinals.sort((a: number, b: number): number => a - b);
    return Uint32Array.from(
      ordinals,
      (i: number): number => this.triangles[i]!,
    );
  }
}
