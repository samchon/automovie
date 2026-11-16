import type { HumanQuadraticProgram as Q } from "../posture/HumanQuadraticProgram";
import { walkLeg } from "./walkLeg";
import type { walkStanceCourse } from "./walkStanceCourse";
import { walkStanceTerms } from "./walkStanceTerms";
import { walkStanceGeometry } from "./walkStanceGeometry";

/**
 * The rows of a stance course's problem linear in the course
 * (`walkStanceModel`), about a course and inside the trust region.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the rows hold and who reads them.
 * @evidence contracts/development/design.md#principled-representation The linear rows apart from the cost and the nonlinear constraints, on the same geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder, read by `walkStanceModel.of`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each row reads the take's own schedule and holds.
 */
export namespace walkStanceRows {
  /**
   * The rows linear in a course.
   *
   * @param knots The knots.
   * @param hold How many first knots are held.
   * @param geometry The problem's geometry (`walkStanceGeometry.of`).
   * @returns The rows at a course inside a trust region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the knot/hold inputs and course-local trust-region row reader.
   * @evidence contracts/development/implementation.md#principled-implementation Compiles the original held, fixed, range and continuing-stance equality rows; each read substitutes the current course and intersects each free range with the unchanged trust bounds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Schedule and placement decisions build one private row description; a single read pass applies only course values and the requested radius.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves row order, every held coordinate, pitch limits, trunk claims and across-knot turn/slide equalities with their original arithmetic.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation scans the knots and their at-most-two stances once; every radius reads O(m) prepared rows without repeated side searches or placement comparisons.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Row topology depends only on the fixed placement/schedule/hold problem, never a held swivel; each query returns fresh rows and coefficient/index arrays so caller mutation cannot alter later reads.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The problem closure retains O(m) private row descriptions until it is released; each returned O(m) row set belongs to its caller and no query history is retained.
   */
  export function of(
    knots: readonly walkStanceCourse.IKnot[],
    hold: number,
    geometry: ReturnType<typeof walkStanceGeometry.of>,
  ): (x: Float64Array, trust: number) => Q.IRow[] {
    const { n, pitchOf, slideOf, turnOf, scheduled }: ReturnType<typeof walkStanceGeometry.of> = geometry;

    /** A row's invariant support and the bound formula its course substitutes. */
    type IBound =
      | { kind: "held"; index: number }
      | { kind: "fixed"; index: number; value: number }
      | { kind: "range"; index: number; low: number; high: number; wide: number }
      | { kind: "join"; index: number; next: number };
    const prepared: IBound[] = [];
    const fixed: (i: number, value: number) => void = (i: number, value: number): void => {
      prepared.push({ kind: "fixed", index: i, value });
    };
    const range: (i: number, low: number, high: number, wide: number) => void = (
      i: number,
      low: number,
      high: number,
      wide: number,
    ): void => {
      prepared.push({ kind: "range", index: i, low, high, wide });
    };

    // The rows linear in the course, about a course, inside the trust region:
    // the drop no less than none; a planted foot pitched about its ball no
    // higher than its schedule pitches it, one the schedule sets on its heel
    // keeping that pitch; the trunk held where the take holds it; a foot that
    // has not landed in the take unturned, and a turn kept while its foot
    // stands. A foot in the air carries its pitch and its turn on the
    // acceleration alone.
    for (let k: number = 0; k < n; k++) {
      const o: number = walkStanceTerms.WIDTH * k;
      const knot: walkStanceCourse.IKnot = knots[k]!;
      if (k < hold) {
        for (let i: number = 0; i < walkStanceTerms.WIDTH; i++)
          prepared.push({ kind: "held", index: o + i });
        // A stance that runs on past the held knots keeps its turn and its
        // slide across the join.
        for (const s of knot.stances) {
          const next: walkStanceCourse.IStance | undefined = knots[k + 1]?.stances.find(
            (t: walkStanceCourse.IStance): boolean => t.side === s.side,
          );
          if (k + 1 >= hold && next?.placement === s.placement)
            for (const i of [
              o + turnOf(s.side),
              o + slideOf(s.side),
              o + slideOf(s.side) + 1,
            ])
              prepared.push({ kind: "join", index: i, next: i + walkStanceTerms.WIDTH });
        }
        continue;
      }
      if (knot.drop !== undefined) fixed(o, knot.drop);
      else range(o, 0, Infinity, walkStanceTerms.TRUST.drop);
      if (knot.trunk !== undefined) {
        fixed(o + 3, knot.trunk.pitch);
        fixed(o + 4, knot.trunk.roll);
      } else {
        range(o + 3, -Infinity, Infinity, walkStanceTerms.TRUST.angle);
        range(o + 4, -Infinity, Infinity, walkStanceTerms.TRUST.angle);
      }
      for (const side of ["left", "right"] as const) {
        const j: number = knot.stances.findIndex(
          (s: walkStanceCourse.IStance): boolean => s.side === side,
        );
        const p: number = o + pitchOf(side);
        const t: number = o + turnOf(side);
        if (j < 0) {
          range(p, -Infinity, Infinity, walkStanceTerms.TRUST.angle);
          range(t, -Infinity, Infinity, walkStanceTerms.TRUST.angle);
          range(o + slideOf(side), -Infinity, Infinity, walkStanceTerms.TRUST.slide);
          range(o + slideOf(side) + 1, -Infinity, Infinity, walkStanceTerms.TRUST.slide);
          continue;
        }
        const pitch: number = scheduled[k]![j]!;
        if (pitch > 1e-6) fixed(p, pitch);
        else range(p, -walkLeg.STEEPEST, pitch, walkStanceTerms.TRUST.angle);
        const stance: walkStanceCourse.IStance = knot.stances[j]!;
        if (stance.turning !== true) fixed(t, 0);
        else range(t, -Infinity, Infinity, walkStanceTerms.TRUST.angle);
        const d: number = o + slideOf(side);
        for (const i of [d, d + 1])
          if (stance.landing === undefined) fixed(i, 0);
          else range(i, -Infinity, Infinity, walkStanceTerms.TRUST.slide);
        // A turn kept from one knot to the next of the same stance.
        const next: walkStanceCourse.IStance | undefined = knots[k + 1]?.stances.find(
          (s: walkStanceCourse.IStance): boolean => s.side === side,
        );
        if (next !== undefined && next.placement === stance.placement)
          for (const i of [t, d, d + 1])
            prepared.push({ kind: "join", index: i, next: i + walkStanceTerms.WIDTH });
      }
    }
    return (x: Float64Array, trust: number): Q.IRow[] =>
      prepared.map((row: IBound): Q.IRow => {
        if (row.kind === "join") {
          const bound: number = x[row.next]! - x[row.index]!;
          return { index: [row.index, row.next], coef: [1, -1], l: bound, u: bound };
        }
        if (row.kind === "range")
          return {
            index: [row.index],
            coef: [1],
            l: Math.max(row.low - x[row.index]!, -row.wide * trust),
            u: Math.min(row.high - x[row.index]!, row.wide * trust),
          };
        const bound: number = row.kind === "held"
          ? x[row.index]! - x[row.index]!
          : row.value - x[row.index]!;
        return { index: [row.index], coef: [1], l: bound, u: bound };
      });
  }
}
