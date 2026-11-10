import type { IAutoMovieVector3 } from "@automovie/interface";

import { minimumJerk } from "./minimumJerk";

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
 *
 * @param origin Where the point starts, metres.
 * @param units Displacements in metres with their start and duration in seconds.
 * @param seconds The instant.
 * @returns Position (m), velocity (m/s) and acceleration (m/s²).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cites the redirection evidence, states the continuity it guarantees and the units.
 * @evidence contracts/development/implementation.md#principled-implementation Linear superposition of minimum-jerk units (Flash and Henis 1991), each the closed-form quintic of `minimumJerk`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop summing scaled profiles.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-positive duration throws instead of producing a step.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the unit count.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates the returned record only.
 */
export function superposeMinimumJerk(
  origin: IAutoMovieVector3,
  units: readonly superposeMinimumJerk.IUnit[],
  seconds: number,
): superposeMinimumJerk.IState {
  const position: IAutoMovieVector3 = { ...origin };
  const velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const acceleration: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const unit of units) {
    if (!(unit.duration > 0))
      throw new Error("A minimum-jerk unit's duration is positive");
    const p: minimumJerk.IProfile = minimumJerk(
      (seconds - unit.start) / unit.duration,
    );
    for (const k of ["x", "y", "z"] as const) {
      position[k] += unit.displacement[k] * p.s;
      velocity[k] += (unit.displacement[k] * p.ds) / unit.duration;
      acceleration[k] +=
        (unit.displacement[k] * p.dds) / (unit.duration * unit.duration);
    }
  }
  return { position, velocity, acceleration };
}

/**
 * Companion types of {@link superposeMinimumJerk}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit.
 * @evidence contracts/development/design.md#principled-representation A unit is a displacement and a time window; the state is position, velocity and acceleration in SI units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What callers build and read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
 */
export namespace superposeMinimumJerk {
  /** One unit. */
  export interface IUnit {
    /** Displacement the unit adds, metres. */
    displacement: IAutoMovieVector3;

    /** Start, seconds. */
    start: number;

    /** Duration, seconds; positive. */
    duration: number;
  }

  /** The moved point at an instant. */
  export interface IState {
    /** Position, metres. */
    position: IAutoMovieVector3;

    /** Velocity, metres per second. */
    velocity: IAutoMovieVector3;

    /** Acceleration, metres per second squared. */
    acceleration: IAutoMovieVector3;
  }
}
