import type {
  IAutoMovieMinimumJerk,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { minimumJerk } from "./minimumJerk";

/** Original component order shared by both actual result demands. */
const COMPONENTS: readonly ["x", "y", "z"] = ["x", "y", "z"];

/**
 * A point moved by overlapping minimum-jerk units, each adding its own
 * displacement over its own time window.
 *
 * Flash and Henis (1991, J. Cogn. Neurosci. 3:220) and Henis and Flash
 * (1995) found that when a target jumps during a reach, the observed hand path
 * is fitted best by superposing a second minimum-jerk unit, from the old
 * target to the new one, on the unmodified first, rather than by aborting and
 * re-planning; Meyer et al. (1988) model corrective submovements the same
 * way. Because every unit is a quintic with zero velocity and acceleration at
 * its ends, the sum is continuous in position, velocity and acceleration at
 * every unit's start and end, ends at rest at the origin plus every
 * displacement, and equals the first unit alone when a later unit's
 * displacement is zero.
 * position reads only that same accumulated point, omitting derivative
 * profiles and velocity/acceleration/state records. Every unit still receives
 * its original positive-duration check and normalized-time admission; an
 * empty unit list performs no time admission, as in the complete reader.
 *
 * @param origin Where the point starts, metres.
 * @param units Displacements in metres with their start and duration in seconds.
 * @param seconds The instant.
 * @returns Position (m), velocity (m/s) and acceleration (m/s²).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cites redirection evidence, states SI units/continuity, complete versus position-only output, per-unit duration/time admission and empty-list no-time-admission behavior.
 * @evidence contracts/development/implementation.md#principled-implementation Both reads linearly superpose the same closed-form minimum-jerk units (Flash and Henis 1991), keeping origin cloning, unit order, normalized-time expression and each position[k]+=displacement[k]*s operation. Full state keeps original first/second derivative scalings and accumulation; position selects the exact same share from minimumJerk.share.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private loop owns unit admission, profile selection and XYZ accumulation for the two actual output demands. The original complete reader returns its three-vector state; position returns the actual wrist/strike consumer's requested point, without a second path formula or callback hook.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every unit still checks duration>0, without adding a finite-duration condition, and its original normalized time reaches the same finite-time refusal before clipping. Units with zero current share are not skipped, preserving signed-zero/nonfinite multiplication effects. Empty units keep the old lack of a time check; no sample reduction, tolerance, derivative approximation or result cache is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Both reads are O(U) for U units and inspect every unit/XYZ contribution. Complete state retains its original three output vectors, wrapper and per-unit derivative profiles. Position-only work omits two derivative polynomials per unit, derivative arithmetic, velocity/acceleration vectors and state wrapper. One private three-name constant also removes the per-unit component-array allocation. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Full and position readers share this exact loop and the minimumJerk scalar/profile owner; every requested time and current unit input is actually evaluated. Only fixed XYZ order is module-owned, with no origin, path, unit or time answer cached across calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Complete output owns three vectors and a state wrapper; position output owns one fresh origin clone, including empty input. Per-unit profiles exist only for full reads and are call-local. The module retains only one fixed three-name component tuple, with no input/output history, growing collection, handle or task.
 */
export function superposeMinimumJerk(
  origin: IAutoMovieVector3,
  units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[],
  seconds: number,
): IAutoMovieSuperposeMinimumJerk.IState {
  return evaluate(origin, units, seconds, true) as IAutoMovieSuperposeMinimumJerk.IState;
}

/** Only the two actual public demands select this private result union. */
type IReading = IAutoMovieSuperposeMinimumJerk.IState | IAutoMovieVector3;

/** One original accumulation, computing derivatives only for complete state. */
function evaluate(
  origin: IAutoMovieVector3,
  units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[],
  seconds: number,
  derivatives: boolean,
): IReading {
  const position: IAutoMovieVector3 = { ...origin };
  const velocity: IAutoMovieVector3 | undefined = derivatives ? { x: 0, y: 0, z: 0 } : undefined;
  const acceleration: IAutoMovieVector3 | undefined = derivatives ? { x: 0, y: 0, z: 0 } : undefined;
  for (const unit of units) {
    if (!(unit.duration > 0))
      throw new Error("A minimum-jerk unit's duration is positive");
    const u: number = (seconds - unit.start) / unit.duration;
    const p: IAutoMovieMinimumJerk.IProfile | undefined = derivatives ? minimumJerk(u) : undefined;
    const s: number = p === undefined ? minimumJerk.share(u) : p.s;
    for (const k of COMPONENTS) {
      position[k] += unit.displacement[k] * s;
      if (p !== undefined) {
        velocity![k] += (unit.displacement[k] * p.ds) / unit.duration;
        acceleration![k] +=
          (unit.displacement[k] * p.dds) / (unit.duration * unit.duration);
      }
    }
  }
  return derivatives ? { position, velocity: velocity!, acceleration: acceleration! } : position;
}

/**
 * Companion types of {@link superposeMinimumJerk}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit.
 * @evidence contracts/development/design.md#principled-representation A unit is a displacement and a time window; the state is position, velocity and acceleration in SI units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The same units serve existing complete physical state and the actual wrist/strike consumer's explicit position-only read; no generic demand construction kit or new path representation is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both outputs reuse interface vectors and the same admitted unit/time/accumulation law; the scalar-position read introduces no sampled path, target cache or altered physical units.
 */
export namespace superposeMinimumJerk {
  /**
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
}
