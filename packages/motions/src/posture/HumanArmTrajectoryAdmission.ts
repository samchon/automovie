import { Vector3 } from "@automovie/engine";

import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/**
 * The admission of an arms' trajectory as it is played back: the knots'
 * interpolant (`HumanArmRefine.hermite`, the one playback reads) placed at
 * every instant of the frame grid and read there by the trajectory model's
 * own evaluation (`HumanArmTrajectoryModel.evaluate`), with every site,
 * allowance and base of that instant. A trajectory optimised on few knots
 * (TrajOpt plans an arm on eleven timesteps, Schulman et al. 2013, section
 * VI) is bounded at its knots only; what the film shows lies between them,
 * so the grid's reading, not the knots', decides.
 *
 * No factor on the knots' own bounds stands in for that reading. Between
 * two knots a coordinate's rate on the cubic Hermite is `B1(u) D + B0(u) m0
 * + B2(u) m1` for the interval's difference `D` and its end tangents `m0`
 * and `m1` (per interval), with `B1 = 6u(1 - u)`, `B0 = (3u - 1)(u - 1)`
 * and `B2 = u(3u - 2)`: it reaches `1.5 D` with both tangents zero and `4/3
 * D` with one zero and the other `D`, so a rate bound at the knots would
 * have to be tightened by up to a half, and a probe's Cartesian speed is not
 * linear in the coordinates besides. The intervals the grid's reading fails
 * in are split instead, and the trajectory solved again on the finer knots,
 * down to the frame grid, where the knots' bounds are the grid's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, at which instants, why the knots' bounds do not suffice, the interpolant's rate and what follows a failure.
 * @evidence contracts/development/design.md#principled-representation The reading is the model's own evaluation on the grid's context, beside the grid instants at which a constraint is passed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reading and the intervals to split, read by `HumanArmTrajectory.solve`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bound of its own: every tolerance and slack is the model's.
 */
export namespace HumanArmTrajectoryAdmission {
  /**
   * A trajectory read on the frame grid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and how it is indexed.
   * @evidence contracts/development/design.md#principled-representation The interpolant's coordinates per arm and grid instant, their evaluation, and the failing instants in grid order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members: `solve` refuses by the evaluation, splits by the instants and reads the needed span on the coordinates.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Indices into the grid's context, not copies of its instants.
   */
  export interface IReading {
    /** Each arm's coordinates at each grid instant, the interpolant's. */
    x: number[][][];

    /** The model's evaluation of them on the grid's context. */
    evaluation: M.IEvaluation;

    /** The grid instants at which, or in an interval beside which, a constraint is passed beyond its tolerance, ascending; empty when the trajectory is admitted. */
    failed: number[];
  }

  /**
   * Read a trajectory on the frame grid.
   *
   * @param c The knots' context.
   * @param fine The context at the frame grid's instants over the same span, its first and last the knots'.
   * @param x Each arm's coordinates at each knot.
   * @returns The reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their correspondence and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The played interpolant is evaluated by the one model the optimiser's iterates and a laid course are evaluated by, so an admitted trajectory meets on the grid what a solved one meets at its knots; the failing instants are read off that evaluation's own records and the model's own tolerances.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The interpolant, one evaluation, then one pass per term over its records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every term the model refuses by is read at every grid instant; a term the evaluation keeps no per-instant record of (the site, its lift, a task point) is located by the evaluation's worst reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms One model evaluation over the grid's G instants, then O(G) scalar passes over its placed arms and pair records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the grid's context, the model's evaluation and its records; nothing is read twice.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
   */
  export function read(
    c: M.IContext,
    fine: M.IContext,
    x: readonly (readonly (readonly number[])[])[],
  ): IReading {
    const at: number[][][] = x.map(
      (arm: readonly (readonly number[])[]): number[][] =>
        fine.times.map((t: number): number[] =>
          HumanArmRefine.hermite(c.times, arm, t),
        ),
    );
    const evaluation: M.IEvaluation = M.evaluate(fine, at);
    const failed: Set<number> = new Set();
    const last: number = fine.n - 1;
    at.forEach((_: number[][], a: number): void => {
      for (let g: number = 0; g <= last; ++g) {
        if (g < last && !fine.still) {
          // The speed and the sweeps of the interval from this instant.
          const dt: number = fine.times[g + 1]! - fine.times[g]!;
          const fast: boolean = T.SPEED.some(
            (p: number): boolean =>
              1000 *
                Vector3.length(
                  V.step(
                    fine.frames[a]![g]!,
                    fine.frames[a]![g + 1]!,
                    evaluation.placed[a]![g]!.probes[p]![0],
                    evaluation.placed[a]![g + 1]!.probes[p]![0],
                  ),
                ) -
                1000 * M.SPEED_LIMIT * dt >
              M.TOLERANCE,
          );
          const swept: boolean = (evaluation.swept[a]![g] ?? []).some(
            (sweep: M.IEvaluation["swept"][number][number][number]): boolean =>
              1000 * (sweep.lower - sweep.clear) > M.TOLERANCE,
          );
          if (fast || swept) {
            failed.add(g);
            failed.add(g + 1);
          }
        }
        const pairs: M.IEvaluation["pairs"][number][number] | undefined =
          evaluation.pairs[a]![g];
        if (pairs === undefined) continue;
        for (const pair of [
          ...pairs.deepest.values(),
          ...pairs.embedded.values(),
        ])
          if (pair.short - T.SKIN > M.TOLERANCE) failed.add(g);
      }
    });
    evaluation.crossing.forEach(
      (pairs: M.IEvaluation["crossing"][number] | undefined, g: number): void => {
        if (pairs === undefined) return;
        for (const pair of pairs.values())
          if (pair.short - T.SKIN > M.TOLERANCE) failed.add(g);
      },
    );
    if (evaluation.worst.value > M.TOLERANCE) failed.add(evaluation.worst.at);
    return {
      x: at,
      evaluation,
      failed: [...failed].sort((p: number, q: number): number => p - q),
    };
  }

  /**
   * The knots' intervals a failed reading asks to split: each interval that
   * holds a failing grid instant, both intervals beside a knot one falls
   * on, an interval that holds no grid instant left as it is. Knots are
   * grid instants, so a stretch split to the end has every grid instant
   * for a knot, and there the reading is the knots' own evaluation.
   *
   * @param knots The knots' indices in the frame grid, ascending.
   * @param reading The reading.
   * @returns The intervals, by their first knot, ascending.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which intervals are returned and which are never split.
   * @evidence contracts/development/implementation.md#principled-implementation The check-and-refine loop of a continuous check: the discretisation is refined where the continuous reading fails, never below the grid the reading itself is taken on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interval search per failing instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every failing instant's interval is returned, so one pass refines every failure rather than the worst alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(F + N) for F failing instants and N knots, both lists ascending.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of two lists.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list and retains nothing.
   */
  export function unbounded(
    knots: readonly number[],
    reading: IReading,
  ): number[] {
    const out: Set<number> = new Set();
    let k: number = 0;
    for (const g of reading.failed) {
      while (k + 2 < knots.length && knots[k + 1]! < g) ++k;
      const beside: number[] =
        k + 2 < knots.length && knots[k + 1] === g ? [k, k + 1] : [k];
      for (const j of beside) if (knots[j + 1]! - knots[j]! >= 2) out.add(j);
    }
    return [...out].sort((p: number, q: number): number => p - q);
  }
}
