import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * The reading of an arms' trajectory as it is played back: the knots'
 * interpolant (`HumanArmRefine.hermite`, the one playback reads) placed at
 * every instant of the frame grid and read there by the trajectory model's
 * own evaluation (`HumanArmTrajectoryModel.evaluate`), with every site,
 * allowance and base of that instant. What the film shows lies between the
 * knots, so the grid's reading, not the knots', decides whether a
 * trajectory is admitted.
 *
 * The optimiser reads the same thing at every iterate
 * (`HumanArmTrajectoryKnots`), so a trajectory it returns carries this
 * reading already; this entry reads a trajectory that did not come from an
 * optimisation on that grid: an earlier plan's solution tried as it stands,
 * or knots that are the grid's own instants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, on what instants, by which model, and who needs this entry beside the optimiser.
 * @evidence contracts/development/design.md#principled-representation The interpolated coordinates with the model's evaluation of them, the two things an admission decides by.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reading, used by `HumanArmTrajectory.solve`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No factor on the knots' bounds stands in for the reading: the model itself is evaluated at every grid instant.
 */
export namespace HumanArmTrajectoryAdmission {
  /**
   * A trajectory read on the frame grid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The coordinates read and their evaluation, nothing derived from them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The evaluation is the model's own record, not a summary of it.
   */
  export interface IReading {
    /** Each arm's coordinates at each grid instant, the interpolant's. */
    x: number[][][];

    /** The model's evaluation of them on the grid's context. */
    evaluation: M.IEvaluation;
  }

  /**
   * Read a trajectory on the frame grid.
   *
   * @param c The knots' context.
   * @param fine The context at the frame grid's instants over the same span, its first and last the knots'.
   * @param x Each arm's coordinates at each knot.
   * @returns The reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the contexts, the coordinates and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The played interpolant is evaluated by the one model the optimiser's iterates are, on the grid's own context, so the reading is the admission the optimiser itself applies.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation an arm and grid instant, then one evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every term the model refuses by is read at every grid instant.
   * @evidence contracts/development/implementation.md#efficient-algorithms One model evaluation over the grid. Each arm prepares its knot-only differences and spans once for all grid instants.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each arm's unchanged knot seconds and coordinates supply the same tangent and span values to any grid instant. The optimiser's own last evaluation serves where it exists.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays and the model's evaluation; retains nothing.
   */
  export function read(
    c: M.IContext,
    fine: M.IContext,
    x: readonly (readonly (readonly number[])[])[],
  ): IReading {
    const at: number[][][] = x.map(
      (arm: readonly (readonly number[])[]): number[][] => {
        const curve: ReturnType<typeof HumanArmRefine.prepareHermite> =
          HumanArmRefine.prepareHermite(c.times, arm);
        return fine.times.map((t: number): number[] => curve(t).coordinates);
      },
    );
    return { x: at, evaluation: M.evaluate(fine, at) };
  }
}
