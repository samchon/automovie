import type {
  IAutoMovieMinimumJerk,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { minimumJerk as minimumJerkImplementation } from "./minimumJerk";

/*
 * Original component order shared by both actual result demands.
 */
const COMPONENTS: readonly ["x", "y", "z"] = ["x", "y", "z"];

/*
 * Private overlapping minimum-jerk evaluator used by the Trajectory owner.
 */
export namespace superposeMinimumJerk {
  /*
   * A point moved by overlapping minimum-jerk units, each adding its own
   * displacement over its own time window.
   *
   * Flash and Henis (1991, J. Cogn. Neurosci. 3:220) and Henis and Flash (1995)
   * found that when a target jumps during a reach, the observed hand path is
   * fitted best by superposing a second minimum-jerk unit, from the old target to
   * the new one, on the unmodified first, rather than by aborting and
   * re-planning; Meyer et al. (1988) model corrective submovements the same way.
   * Because every unit is a quintic with zero velocity and acceleration at its
   * ends, the sum is continuous in position, velocity and acceleration at every
   * unit's start and end, ends at rest at the origin plus every displacement, and
   * equals the first unit alone when a later unit's displacement is zero.
   * position reads only that same accumulated point, omitting derivative profiles
   * and velocity/acceleration/state records. Every unit still receives its
   * original positive-duration check and normalized-time admission; an empty unit
   * list performs no time admission, as in the complete reader.
   * Parameter origin: Where the point starts, metres.
   * Parameter units: Displacements in metres with their start and duration in
   * seconds.
   * Parameter seconds: The instant.
   * Returns: Position (m), velocity (m/s) and acceleration (m/s²).
   */
  export function superpose(
    origin: IAutoMovieVector3,
    units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[],
    seconds: number,
  ): IAutoMovieSuperposeMinimumJerk.IState {
    return evaluate(
      origin,
      units,
      seconds,
      true,
    ) as IAutoMovieSuperposeMinimumJerk.IState;
  }

  /*
   * The same accumulated position in metres, with one fresh point and no
   * velocity/acceleration/state records. Original unit order, positive-duration
   * admission, normalized-time refusal and position arithmetic remain; empty
   * units return a fresh origin clone without adding a time check.
   */
  export function position(
    origin: IAutoMovieVector3,
    units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[],
    seconds: number,
  ): IAutoMovieVector3 {
    return evaluate(origin, units, seconds, false) as IAutoMovieVector3;
  }

  /*
   * Only the two actual public demands select this private result union.
   */
  type IReading = IAutoMovieSuperposeMinimumJerk.IState | IAutoMovieVector3;

    /*
     * One original accumulation, computing derivatives only for complete state.
     */
  function evaluate(
    origin: IAutoMovieVector3,
    units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[],
    seconds: number,
    derivatives: boolean,
  ): IReading {
    const position: IAutoMovieVector3 = { ...origin };
    const velocity: IAutoMovieVector3 | undefined = derivatives
      ? { x: 0, y: 0, z: 0 }
      : undefined;
    const acceleration: IAutoMovieVector3 | undefined = derivatives
      ? { x: 0, y: 0, z: 0 }
      : undefined;
    for (const unit of units) {
      if (!(unit.duration > 0))
        throw new Error("A minimum-jerk unit's duration is positive");
      const u: number = (seconds - unit.start) / unit.duration;
      const p: IAutoMovieMinimumJerk.IProfile | undefined = derivatives
        ? minimumJerkImplementation.profile(u)
        : undefined;
      const s: number = p === undefined ? minimumJerkImplementation.share(u) : p.s;
      for (const k of COMPONENTS) {
        position[k] += unit.displacement[k] * s;
        if (p !== undefined) {
          velocity![k] += (unit.displacement[k] * p.ds) / unit.duration;
          acceleration![k] +=
            (unit.displacement[k] * p.dds) / (unit.duration * unit.duration);
        }
      }
    }
    return derivatives
      ? { position, velocity: velocity!, acceleration: acceleration! }
      : position;
  }
}
