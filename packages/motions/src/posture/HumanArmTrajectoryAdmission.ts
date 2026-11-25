import { HumanArmTrajectoryKnots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * The reading of an arms' trajectory as it is played back: the knots'
 * interpolant (`HumanArmRefine.hermite`, the one playback reads) placed at
 * every instant of the frame grid and read by the trajectory model's own
 * evaluation (`HumanArmTrajectoryModel.evaluate`) as the optimiser reads its
 * iterates: every motion term at every grid instant, with every site, allowance
 * and base of that instant, and the clearance at and between frame instants.
 *
 * This entry validates an earlier plan's solution before reusing it.
 */
export namespace HumanArmTrajectoryAdmission {
  /** A trajectory read on the frame grid. */
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
   * @param fine The context at the frame grid's instants over the same span,
   *   its first and last the knots'.
   * @param x Each arm's coordinates at each knot.
   * @param rates The same bounded knot rates used in playback.
   * @returns The reading.
   */
  export function read(
    c: M.IContext,
    fine: M.IContext,
    x: readonly (readonly (readonly number[])[])[],
    rates: HumanArmTrajectoryKnots.IRates,
  ): IReading {
    const at: number[][][] = HumanArmTrajectoryKnots.read(
      c.times,
      fine.times,
      x,
      rates,
    );
    return {
      x: at,
      evaluation: M.evaluate(fine, at),
    };
  }
}
