import type {
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanWalkStanceCourse,
} from "@automovie/interface";

import { walkLeg } from "./walkLeg";
import { walkStanceGeometry } from "./walkStanceGeometry";
import { walkStanceTerms } from "./walkStanceTerms";

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
   */
  export function of(
    knots: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[],
    hold: number,
    geometry: ReturnType<typeof walkStanceGeometry.of>,
  ): (
    x: Float64Array,
    trust: number,
  ) => IAutoMovieMotionHumanQuadraticProgram.IRow[] {
    const { n, pitchOf, slideOf, turnOf, scheduled } = geometry; // The rows linear in the course, about a course, inside the trust region:
    // the drop no less than none; a planted foot pitched about its ball no
    // higher than its schedule pitches it, one the schedule sets on its heel
    // keeping that pitch; the trunk held where the take holds it; a foot that
    // has not landed in the take unturned, and a turn kept while its foot
    // stands. A foot in the air carries its pitch and its turn on the
    // acceleration alone.
    const bounds = (
      x: Float64Array,
      trust: number,
    ): IAutoMovieMotionHumanQuadraticProgram.IRow[] => {
      const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
      const fixed = (i: number, value: number): void => {
        rows.push({
          index: [i],
          coef: [1],
          l: value - x[i]!,
          u: value - x[i]!,
        });
      };
      const range = (
        i: number,
        low: number,
        high: number,
        wide: number,
      ): void => {
        rows.push({
          index: [i],
          coef: [1],
          l: Math.max(low - x[i]!, -wide * trust),
          u: Math.min(high - x[i]!, wide * trust),
        });
      };
      for (let k: number = 0; k < n; k++) {
        const o: number = walkStanceTerms.WIDTH * k;
        const knot: IAutoMovieMotionHumanWalkStanceCourse.IKnot = knots[k]!;
        if (k < hold) {
          for (let i: number = 0; i < walkStanceTerms.WIDTH; i++)
            fixed(o + i, x[o + i]!);
          // A stance that runs on past the held knots keeps its turn and its
          // slide across the join.
          for (const s of knot.stances) {
            const next:
              | IAutoMovieMotionHumanWalkStanceCourse.IStance
              | undefined = knots[k + 1]?.stances.find(
              (t: IAutoMovieMotionHumanWalkStanceCourse.IStance): boolean =>
                t.side === s.side,
            );
            if (k + 1 >= hold && next?.placement === s.placement)
              for (const i of [
                o + turnOf(s.side),
                o + slideOf(s.side),
                o + slideOf(s.side) + 1,
              ])
                rows.push({
                  index: [i, i + walkStanceTerms.WIDTH],
                  coef: [1, -1],
                  l: x[i + walkStanceTerms.WIDTH]! - x[i]!,
                  u: x[i + walkStanceTerms.WIDTH]! - x[i]!,
                });
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
            (s: IAutoMovieMotionHumanWalkStanceCourse.IStance): boolean =>
              s.side === side,
          );
          const p: number = o + pitchOf(side);
          const t: number = o + turnOf(side);
          if (j < 0) {
            range(p, -Infinity, Infinity, walkStanceTerms.TRUST.angle);
            range(t, -Infinity, Infinity, walkStanceTerms.TRUST.angle);
            range(
              o + slideOf(side),
              -Infinity,
              Infinity,
              walkStanceTerms.TRUST.slide,
            );
            range(
              o + slideOf(side) + 1,
              -Infinity,
              Infinity,
              walkStanceTerms.TRUST.slide,
            );
            continue;
          }
          const pitch: number = scheduled[k]![j]!;
          if (pitch > 1e-6) fixed(p, pitch);
          else range(p, -walkLeg.STEEPEST, pitch, walkStanceTerms.TRUST.angle);
          const stance: IAutoMovieMotionHumanWalkStanceCourse.IStance =
            knot.stances[j]!;
          if (stance.turning !== true) fixed(t, 0);
          else range(t, -Infinity, Infinity, walkStanceTerms.TRUST.angle);
          const d: number = o + slideOf(side);
          for (const i of [d, d + 1])
            if (stance.landing === undefined) fixed(i, 0);
            else range(i, -Infinity, Infinity, walkStanceTerms.TRUST.slide);
          // A turn kept from one knot to the next of the same stance.
          const next:
            | IAutoMovieMotionHumanWalkStanceCourse.IStance
            | undefined = knots[k + 1]?.stances.find(
            (s: IAutoMovieMotionHumanWalkStanceCourse.IStance): boolean =>
              s.side === side,
          );
          if (next !== undefined && next.placement === stance.placement)
            for (const i of [t, d, d + 1])
              rows.push({
                index: [i, i + walkStanceTerms.WIDTH],
                coef: [1, -1],
                l: x[i + walkStanceTerms.WIDTH]! - x[i]!,
                u: x[i + walkStanceTerms.WIDTH]! - x[i]!,
              });
        }
      }
      return rows;
    };
    return bounds;
  }
}
