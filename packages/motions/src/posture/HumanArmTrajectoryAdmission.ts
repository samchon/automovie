import { HumanArmTrajectoryContinuous } from "./HumanArmTrajectoryContinuous";
import { HumanArmTrajectoryKnots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * The reading of an arms' trajectory as it is played back: the knots'
 * interpolant (`HumanArmTrajectoryKnots.read`, the one playback reads) at every
 * instant of the frame grid and read by the trajectory model's own evaluation
 * (`HumanArmTrajectoryModel.evaluate`) as the optimiser reads its iterates:
 * every motion term at every grid instant, with every site, allowance and base
 * of that instant, and the clearance at and between frame instants.
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
      evaluation: continuous(fine, c.times, x, rates, M.evaluate(fine, at)),
    };
  }

  /**
   * Finish admission on the same curve as playback. The existing grid
   * evaluation still owns speed, world sweeps and sites.
   *
   * @param c The admission frame context.
   * @param knots The playback knot clock.
   * @param x Coordinates at those knots.
   * @param rates The exact velocities and accelerations used by playback.
   * @param reading The native frame verdict.
   * @returns The frame verdict and the first failure of each fixed interval.
   */
  export function continuous(
    c: M.IContext,
    knots: readonly number[],
    x: readonly (readonly (readonly number[])[])[],
    rates: HumanArmTrajectoryKnots.IRates,
    reading: M.IEvaluation,
  ): M.IEvaluation {
    if (c.fixedSelf === undefined || reading.worst.value > M.TOLERANCE)
      return reading;
    const curved: M.ICurveWitness[] = HumanArmTrajectoryContinuous(
      c,
      knots,
      x,
      rates,
    );
    if (curved.length === 0) return reading;
    const failing: boolean[] = [...reading.failing];
    let violation: number = reading.violation;
    let worst: M.IEvaluation["worst"] = reading.worst;
    for (const witness of curved) {
      failing[witness.k] = true;
      failing[witness.k + 1] = true;
      violation += witness.value;
      if (witness.value > worst.value)
        worst = {
          value: witness.value,
          what: `${witness.what} ${witness.value.toFixed(1)} mm deep at ${witness.time.toFixed(3)} s of the played curve`,
          at: witness.k,
          term: "swept",
          axis: "region",
        };
    }
    return { ...reading, worst, placement: worst, failing, violation, curved };
  }
}
