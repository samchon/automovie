import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The valley between two neighbouring children of a branch on a section plane of their parent: how far the skin stands inside the line
 * that bridges the two children's own bulges, on either side.
 *
 * A composed end measures its host's ring against the outline of its children's root sections and refuses a ring farther from it than
 * the shortest rail (`IAutoMovieConstructionSplit.ICompose`). The outline has a valley between each pair of neighbours and a smooth
 * host ring has none, so a parent can end only where those valleys are within the children's rails
 * (`packages/human/docs/techniques/joints-one-shot.md`, Where a parent ends). The valley is read locally, against the hull of the
 * skin over the two children alone: a hollow of the parent's own that spans several children (the palm's, under the hull of the
 * whole hand) is no valley between two of them.
 */
export namespace FamilyConicValley {
  /** A point of a plane's chart, mm. */
  export type P = [number, number];

  /**
   * One pair's reading.
   *
   * @evidence contracts/development/design.md#principled-representation Whether one closed chain holds both children, and the two depths if so, or the least gap if each has its own.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the end-plane reading and by the parent's end rule.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A pair with no closed chain round a child is reported as that, never as a depth.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units and sides.
   */
  export interface IPair {
    /** `one`: one closed chain holds both children; `apart`: each has its own; `open`: a child lies in no closed chain. */
    kind: "one" | "apart" | "open";

    /** The distance between the two children's piercing points, mm. */
    span: number;

    /** With `one`: the valley's depth on the left and on the right of the line from the first child to the second, mm. */
    depths?: [number, number];

    /** With `apart`: the least distance between the two chains, mm. */
    gap?: number;
  }

  /** How far beyond each child's piercing point, as a share of their distance, the skin over the two children is taken: half of it, a child's own half breadth when neighbours touch. */
  const BEYOND: number = 0.5;

  /**
   * Read every pair of neighbouring children on one plane.
   *
   * @param chains The reference's skin cut by the plane, in the plane's chart.
   * @param pierced Where each child's course pierces the plane, in order along the row; null for a child whose course does not.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A chain holds a child when it winds about the child's piercing point; the valley on a side is the greatest distance, among the skin's points between the two piercing points on that side, to the boundary of the convex hull of that side's skin over the two children with the two piercing points.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Ownership by winding, then one hull a side a pair.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No threshold decides anything here; depths and gaps are reported as measured.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the chain's points a pair besides one hull of the local points.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The chains are cut once by the caller and serve every pair.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns numbers.
   * @evidence contracts/development/common.md#meaningful-documentation States the measure and the three outcomes.
   */
  export function pairs(chains: readonly { points: P[]; closed: boolean }[], pierced: readonly (P | null)[]): IPair[] {
    const holds = (points: readonly P[], q: P): boolean => {
      let turn: number = 0;
      for (let i: number = 0; i < points.length; ++i) {
        const [a, b]: P[] = [points[i]!, points[(i + 1) % points.length]!];
        turn += Math.atan2((a![0] - q[0]) * (b![1] - q[1]) - (a![1] - q[1]) * (b![0] - q[0]), (a![0] - q[0]) * (b![0] - q[0]) + (a![1] - q[1]) * (b![1] - q[1]));
      }
      return Math.abs(turn) > Math.PI;
    };
    const owner: (number | null)[] = pierced.map((q: P | null): number | null => {
      if (q === null) return null;
      const k: number = chains.findIndex((chain: { points: P[]; closed: boolean }): boolean => chain.closed && holds(chain.points, q));
      return k < 0 ? null : k;
    });
    const out: IPair[] = [];
    for (let i: number = 0; i + 1 < pierced.length; ++i) {
      const [qa, qb]: (P | null)[] = [pierced[i]!, pierced[i + 1]!];
      const [a, b]: (number | null)[] = [owner[i]!, owner[i + 1]!];
      const span: number = qa === null || qb === null ? NaN : Math.hypot(qb![0] - qa![0], qb![1] - qa![1]);
      if (qa === null || qb === null || a === null || b === null || a === undefined || b === undefined) {
        out.push({ kind: "open", span });
        continue;
      }
      if (a !== b) {
        let gap: number = Infinity;
        for (const p of chains[a]!.points) for (const q of chains[b]!.points) gap = Math.min(gap, Math.hypot(p[0] - q[0], p[1] - q[1]));
        out.push({ kind: "apart", span, gap });
        continue;
      }
      const along = (p: P): number => ((p[0] - qa![0]) * (qb![0] - qa![0]) + (p[1] - qa![1]) * (qb![1] - qa![1])) / (span * span);
      const left = (p: P): boolean => (qb![0] - qa![0]) * (p[1] - qa![1]) - (qb![1] - qa![1]) * (p[0] - qa![0]) > 0;
      const depths: [number, number] = [0, 0];
      for (const side of [0, 1]) {
        const local: P[] = chains[a]!.points.filter((p: P): boolean => left(p) === (side === 0) && along(p) > -BEYOND && along(p) < 1 + BEYOND);
        if (local.length < 2) continue;
        const hull: P[] = R.hull([...local, qa!, qb!]) as P[];
        const inside = (p: P): number =>
          Math.min(...hull.map((h: P, k: number): number => {
            // The distance to the hull's edge as a segment, not to its line: a far edge's line can pass close by.
            const g: P = hull[(k + 1) % hull.length]!;
            const e: P = [g[0] - h[0], g[1] - h[1]];
            const t: number = Math.max(0, Math.min(1, ((p[0] - h[0]) * e[0] + (p[1] - h[1]) * e[1]) / (e[0] * e[0] + e[1] * e[1] || 1)));
            return Math.hypot(p[0] - h[0] - t * e[0], p[1] - h[1] - t * e[1]);
          }));
        for (const p of local) if (along(p) > 0 && along(p) < 1) depths[side] = Math.max(depths[side]!, inside(p));
      }
      out.push({ kind: "one", span, depths });
    }
    return out;
  }
}
