import type { IAutoMovieMotionHumanQuadraticProgram } from "../posture/IAutoMovieMotionHumanQuadraticProgram";
import type { IAutoMovieMotionHumanWalkStanceCourse } from "./IAutoMovieMotionHumanWalkStanceCourse";

/**
 * Contracts used by walkStanceSolve.optimise, walkStanceSolve.record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation problem: Stance course, variables and reference poses for this optimisation pass. rows: Mutable constraint rows accumulated for the course's quadratic solve. planted: Planted-foot target and its reference posture at the sampled course instant.
 * @evidence contracts/development/design.md#principled-representation problem: Stance course, variables and reference poses for this optimisation pass. rows: Mutable constraint rows accumulated for the course's quadratic solve. planted: Planted-foot target and its reference posture at the sampled course instant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceSolve.ts (walkStanceSolve.optimise, at); actions/walkStanceSolve.ts (walkStanceSolve.record, read).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkStanceCourse.IProblem, IAutoMovieMotionHumanQuadraticProgram.IRow, IAutoMovieMotionHumanWalkStanceCourse.IPlanted identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWalkStanceSolve {
  /**
   * A course's problem solved by the shared sequential convex loop (`HumanSequentialConvex`, TrajOpt's outer loop, Schulman et al. 2014) under the body's schedule (`schedule`) and `ROUNDS`, its penalty steered at every iterate from `PENALTY` (`IAutoMovieMotionHumanSequentialConvex.IOptions.steer`), so the objective does not pull a course off its constraints: each convex subproblem, the problem's own with any rows the caller adds, is solved within the region by `HumanQuadraticProgram`, warm-started across the region's shrinking and from the multipliers of the last step taken, and a step is predicted to lower the merit by what it lowers the subproblem's value, its Gauss-Newton cost and its soft rows' l1 excess. Input at of walkStanceSolve.optimise. The problem a course is evaluated by, and, about a course whose subproblem is built (`model`), the problem convexified there and the rows added to it; `shape` with none when absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation problem: Stance course, variables and reference poses for this optimisation pass. rows: Mutable constraint rows accumulated for the course's quadratic solve.
   * @evidence contracts/development/design.md#principled-representation problem: Stance course, variables and reference poses for this optimisation pass. rows: Mutable constraint rows accumulated for the course's quadratic solve.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceSolve.ts (walkStanceSolve.optimise, at).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkStanceCourse.IProblem, IAutoMovieMotionHumanQuadraticProgram.IRow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IOptimiseAt = (
    x: Float64Array,
    model: boolean,
  ) => {
    /** Stance course, variables and reference poses for this optimisation pass. */
    problem: IAutoMovieMotionHumanWalkStanceCourse.IProblem;
    /** Mutable constraint rows accumulated for the course's quadratic solve. */
    rows: IAutoMovieMotionHumanQuadraticProgram.IRow[];
  };

  /**
   * A course's record at its variables. Input read of walkStanceSolve.record.
   *
   * @evidence contracts/development/common.md#meaningful-documentation planted: Planted-foot target and its reference posture at the sampled course instant.
   * @evidence contracts/development/design.md#principled-representation planted: Planted-foot target and its reference posture at the sampled course instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStanceSolve.ts (walkStanceSolve.record, read).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkStanceCourse.IPlanted identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IRecordRead = (
    x: Float64Array,
    k: number,
    j: number,
  ) => {
    /** Planted-foot target and its reference posture at the sampled course instant. */
    planted: IAutoMovieMotionHumanWalkStanceCourse.IPlanted;
  };
}
