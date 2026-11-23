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
 */
export namespace HumanArmTrajectoryAdmission {
  /**
   * A trajectory read on the frame grid.
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
