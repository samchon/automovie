import { AutoMovieConstructionPortField as Field } from "./AutoMovieConstructionPortField";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World point or derivative, mm. */
type Vec3 = AutoMovieSolidVector.Vec3;
const { combine, sub } = AutoMovieSolidVector;

/**
 * A split band whose end edge is its child's rail curve at every clock, not only at its columns (`IAutoMovieConstructionSplit.ICut`).
 *
 * The column strip `B(u, c)` ends on the rail at its columns and, between them, on its own interpolation of the columns' ends. With
 * `E(c) = P(rho(chi(c)), chi(c))` the child's point on its rail at the band's correspondence `chi` (the periodic cubic through the
 * columns' child phases) and `V(s) = s^3 (10 - 15 s + 6 s^2)`, `s = u / L`, the band is
 *
 * ```text
 * S(u, c) = B(u, c) + V(u / L) (E(c) - B(L, c))
 * ```
 *
 * `V` is 0 with its first two derivatives at the loop and 1 with them zero at the rail, so `S` keeps the strip's loop edge and its
 * cross 2-jets at both edges and ends on `E(c)` itself. The displacement `E - B(L, .)` vanishes at every column and is the strip's
 * interpolation error between them. Every derivative is the chain rule on the child's 2-jet, the rail's and the correspondence's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the carried band, the weight's flatness and what each edge keeps.
 * @evidence contracts/development/design.md#principled-representation One generating owner for the child's seam: the band's end edge evaluates the child on its rail curve, the curve the child's rail cycle keeps, so the two faces share one edge between columns (construction.md, Connections: Ownership), as a port's exact band does on its rail.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The carried band with its two correspondence readers, and one builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Refuses a correspondence that does not advance; nothing is refitted and the cross ribbons are the strip's own.
 */
export namespace AutoMovieConstructionSplitEdge {
  /**
   * A carried band and its correspondence to the child.
   *
   * @evidence contracts/development/design.md#principled-representation The surface with the two maps the child's seam needs in both directions, as `AutoMovieConstructionPortBand.IBand`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The maps are the band's own correspondence, not a nearest search.
   * @evidence contracts/development/common.md#meaningful-documentation States each reader's charts.
   */
  export interface IEdge {
    /** The band's surface, the strip's chart, name, orientation, period and domain. */
    surface: IAutoMovieSolidSurface;

    /**
     * The child's chart point on its rail at a band clock.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the chart.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared callback slot; `carried` is its implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared callback slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared callback slot retains nothing.
     */
    rail: (clock: number) => [number, number];

    /**
     * The band clock whose rail point stands at a child phase, in `[0, 2 pi)`: the inverse of the monotone correspondence.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the range.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared callback slot; `carried` is its implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared callback slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared callback slot retains nothing.
     */
    clock: (phase: number) => number;
  }

  /**
   * Carry a column strip's end edge onto its child's rail curve, or the reason it cannot be.
   *
   * @param strip The column strip's surface, chart `(station mm, clock rad)`.
   * @param length The strip's span, mm.
   * @param child The child's skin.
   * @param rail The rail's station at a child phase with two derivatives (`AutoMovieConstructionSkinCut.ICut.at`).
   * @param childPhases The child's phase at each column, unwrapped along the clock.
   * @param start The loop's own curve at a band clock with its first and second clock derivatives (the host's ring on an arc, the shared seam on a seam), or absent to keep the strip's loop edge. With it the band's loop edge is that curve at every clock, carried by the complementary weight `1 - V`, so two bands that read one seam share its points and tangents between columns as well as at them; the curve's tangent turns at a fork, where the loop has its corner.
   * @returns The carried band, or the refusal.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The strip plus a displacement onto the owner's curve weighted by the quintic smoothstep, flat to second order at both edges, so both edges' cross 2-jets are the strip's and the end edge is the child on its rail.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The correspondence field, the rail's point with two clock derivatives, then one jet reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a correspondence whose derivative reaches zero from the field's own bounds; no derivative is differenced.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n) to prepare; a reading takes two strip jets, one child jet and one rail reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The correspondence field is prepared once for every reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The surface retains the strip, the child, the rail reader and one field.
   */
  export function carried(
    strip: IAutoMovieSolidSurface,
    length: number,
    child: IAutoMovieSolidSurface,
    rail: (psi: number) => [number, number, number],
    childPhases: readonly number[],
    start?: (clock: number) => { p: Vec3; d1: Vec3; d2: Vec3 },
  ): IEdge | string {
    const n: number = childPhases.length;
    const turn: number = 2 * Math.PI;
    const sense: number = Math.sign(childPhases[n - 1]! - childPhases[0]!);
    const delta: Field.IField = Field.periodic(
      childPhases.map((phase: number, k: number): number => phase - (sense * turn * k) / n),
    );
    if (!(sense !== 0 && (sense > 0 ? 1 + delta.slopes[0] > 0 : 1 - delta.slopes[1] > 0)))
      return "the child's phase between the band's columns does not advance with its clock";

    /** The child's phase at a band clock with two derivatives. */
    const phase = (c: number): [number, number, number] => {
      const [x, x1, x2]: [number, number, number] = delta.at(c);
      return [sense * c + x, sense + x1, x2];
    };

    /** The child's point on its rail at a band clock with its first and second clock derivatives. */
    const edge = (c: number): { p: Vec3; d1: Vec3; d2: Vec3 } => {
      const [chi, chi1, chi2]: [number, number, number] = phase(c);
      const [r, r1, r2]: [number, number, number] = rail(chi);
      const j: IAutoMovieSolidSurface.IJet = child.jet(r, chi);
      const along: Vec3 = combine([[r1, j.u], [1, j.v]]);
      const bend: Vec3 = combine([[r1 * r1, j.uu], [2 * r1, j.uv], [1, j.vv], [r2, j.u]]);
      return {
        p: [j.p[0], j.p[1], j.p[2]],
        d1: combine([[chi1, along]]),
        d2: combine([[chi1 * chi1, bend], [chi2, along]]),
      };
    };
    return {
      surface: {
        name: strip.name,
        orientation: strip.orientation,
        ...(strip.period === undefined ? {} : { period: strip.period }),
        ...(strip.domain === undefined ? {} : { domain: strip.domain }),
        jet: (u: number, c: number): IAutoMovieSolidSurface.IJet => {
          const base: IAutoMovieSolidSurface.IJet = strip.jet(u, c);
          const s: number = u / length;
          const V: number = s * s * s * (10 - 15 * s + 6 * s * s);
          const V1: number = (30 * s * s * (1 - s) * (1 - s)) / length;
          const V2: number = (60 * s * (1 - s) * (1 - 2 * s)) / (length * length);
          const zero: Vec3 = [0, 0, 0];

          // Each edge's displacement onto its owner's curve; its weight vanishes with its first two derivatives at the other edge.
          let [D, D1, D2]: [Vec3, Vec3, Vec3] = [zero, zero, zero];
          if (s !== 0) {
            const last: IAutoMovieSolidSurface.IJet = strip.jet(length, c);
            const E: { p: Vec3; d1: Vec3; d2: Vec3 } = edge(c);
            [D, D1, D2] = [sub(E.p, last.p), sub(E.d1, last.v), sub(E.d2, last.vv)];
          }
          let [A, A1, A2]: [Vec3, Vec3, Vec3] = [zero, zero, zero];
          if (start !== undefined && s !== 1) {
            const first: IAutoMovieSolidSurface.IJet = strip.jet(0, c);
            const E: { p: Vec3; d1: Vec3; d2: Vec3 } = start(c);
            [A, A1, A2] = [sub(E.p, first.p), sub(E.d1, first.v), sub(E.d2, first.vv)];
          }
          return {
            p: combine([[1, base.p], [V, D], [1 - V, A]]),
            u: combine([[1, base.u], [V1, D], [-V1, A]]),
            v: combine([[1, base.v], [V, D1], [1 - V, A1]]),
            uu: combine([[1, base.uu], [V2, D], [-V2, A]]),
            uv: combine([[1, base.uv], [V1, D1], [-V1, A1]]),
            vv: combine([[1, base.vv], [V, D2], [1 - V, A2]]),
          };
        },
      },
      rail: (c: number): [number, number] => {
        const chi: number = phase(c)[0];
        return [rail(chi)[0], chi];
      },
      clock: (target: number): number => {
        // The clock in [0, 2 pi) whose phase stands at the target's turn: phase(c) - phase(0) runs monotonically through one turn.
        const base: number = phase(0)[0];
        const x: number = sense * (target - base);
        const goal: number = base + sense * (x - turn * Math.floor(x / turn));
        let [lo, hi]: [number, number] = [0, turn];
        for (let step: number = 0; step < 200; ++step) {
          const mid: number = (lo + hi) / 2;
          if (mid === lo || mid === hi) break;
          if (sense * (phase(mid)[0] - goal) < 0) lo = mid;
          else hi = mid;
        }
        return Math.abs(sense * (phase(lo)[0] - goal)) <= Math.abs(sense * (phase(hi)[0] - goal)) ? lo : hi % turn;
      },
    };
  }
}
