import { AutoMovieGravity, Quaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame, ArchetypeRefusal } from "../core";
import type { createSwing } from "./createSwing";

/** A unit scale: the rides move rigid frames. */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/** The pivot axis: the swing turns about the beam, `+X`. */
const AXIS: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * A pumped playground swing on the ride's clock: the hanging seat model
 * (`createSwing.seat`) turns about the beam's pivot axis by the swing
 * angle, positive toward `+Z`.
 *
 * The seat is a simple pendulum of the hanging length to the seated
 * centre of mass, with angular frequency `sqrt(g / length)`. Seated
 * pumping, by the rider turning the body at each turning point, adds a
 * fixed angle to the amplitude every half swing (Wirkus, Rand and Ruina,
 * "How to pump a swing", College Math J 29:266, 1998,
 * https://www.maa.org/pubs/CMJ_September98.html). Each half swing runs
 * from one turning point to the next on a cosine whose two ends are
 * those turning points, so the seat is still at each turning point and
 * its path stays smooth while the amplitude grows. Half swings without
 * pumping keep their amplitude.
 *
 * @param swing The installed swing frame.
 * @param placement Its world placement.
 * @param ride The start, the pumped half swings and the angle each adds.
 * @returns The seat's frame and the turning points on the ride's clock.
 * @throws {ArchetypeRefusal} For a hanging length, start angle or increment out of range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clock, the pendulum, the pumping rule with its source and the smooth half swing.
 * @evidence contracts/development/implementation.md#principled-implementation The small-angle pendulum period with the seated-pumping amplitude increment per half swing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the inputs, list the turning points once, then read the half swing a second falls in.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The increment is the caller's, computed from the rider's body; the ride only applies it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the half swings to list turning points; each read finds its half swing in constant time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The turning points serve every read.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one angle per half swing while the caller keeps the ride.
 */
export function rideSwing(
  swing: Archetype<"ground", createSwing.Dimension>,
  placement: IAutoMovieTransform,
  ride: rideSwing.IParams,
): rideSwing.IRide {
  const length: number = ride.length;
  const hanging: number = swing.dimensions.pivot! - swing.dimensions.clearance!;
  if (!(length > 0 && length <= hanging + 1))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "swing",
      axis: "length",
      value: length,
      feasible: { kind: "range", minimum: 0, maximum: hanging + 1, unit: "m" },
      reason:
        "the pendulum length runs from the pivot to the seated centre of mass",
      fix: "give the distance from the beam to the rider's centre of mass",
    });
  if (
    !(Math.abs(ride.start) < 60 && ride.increment >= 0 && ride.increment < 15)
  )
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "swing",
      axis: "increment",
      value: ride.increment,
      feasible: { kind: "range", minimum: 0, maximum: 15, unit: "degrees" },
      reason:
        "the start angle and each half swing's added angle must stay in the swing's small range",
      fix: "start below 60 degrees and add less than 15 degrees a half swing",
    });
  const omega: number = Math.sqrt(AutoMovieGravity.STANDARD / length);
  const half: number = Math.PI / omega;

  // The turning points, alternating in sign: each pumped half swing ends
  // one increment wider than it started, capped below 60 degrees.
  const turns: number[] = [ride.start];
  for (let k: number = 0; k < ride.halves; ++k) {
    const amplitude: number = Math.min(
      59,
      Math.abs(turns[k]!) + (k < ride.pumps ? ride.increment : 0),
    );
    turns.push(turns[k]! >= 0 ? -amplitude : amplitude);
  }
  const angle = (seconds: number): number => {
    const k: number = Math.max(
      0,
      Math.min(ride.halves - 1, Math.floor(seconds / half)),
    );
    const tau: number = Math.max(0, Math.min(half, seconds - k * half));
    const from: number = turns[k]!;
    const to: number = turns[k + 1]!;
    return (from + to) / 2 + ((from - to) / 2) * Math.cos(omega * tau);
  };
  return {
    half,
    turns,
    angle,
    seat: (seconds: number): IAutoMovieTransform =>
      ArchetypeFrame.compose(placement, {
        scale: ONE,
        translation: { x: 0, y: swing.dimensions.pivot!, z: 0 },
        rotation: Quaternion.fromAxisAngle(AXIS, -angle(seconds)),
      }),
  };
}

/**
 * The swing ride's parameters and readers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and clock.
 * @evidence contracts/development/design.md#principled-representation Angles in degrees, lengths in metres, seconds on the ride's clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The playground test and its compositions read these members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The increment is an input from the rider's body, not a fitted constant.
 */
export namespace rideSwing {
  /**
   * How the swing is set going and pumped.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The pendulum length, start angle, half swings and increment.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideSwing`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No velocity input: the ride starts at a turning point.
   */
  export interface IParams {
    /** Pivot to the seated centre of mass, metres. */
    length: number;

    /** The swing angle at second 0, a turning point, degrees toward `+Z`. */
    start: number;

    /** Whole number of half swings the ride lasts; each takes pi / sqrt(g / length) seconds, with standard gravity g. */
    halves: number;

    /** Whole number of leading half swings that gain `increment`, at most `halves`; later half swings keep their amplitude. */
    pumps: number;

    /** The angle each pumped half swing adds to the amplitude, degrees. */
    increment: number;
  }

  /**
   * One running swing's readers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and clock.
   * @evidence contracts/development/design.md#principled-representation The half-swing time, the turning angles and two readers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a rider's composition and the test read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No reader stores a pose.
   */
  export interface IRide {
    /** Seconds from one turning point to the next. */
    half: number;

    /** The swing angle at each turning point, degrees, starting at second 0. */
    turns: readonly number[];

    /**
     * The swing angle at a ride second, degrees toward `+Z`.
     *
     * @param seconds Ride seconds.
     * @returns The angle.
     */
    angle(seconds: number): number;

    /**
     * The hanging seat model's world frame at a ride second.
     *
     * @param seconds Ride seconds.
     * @returns The frame.
     */
    seat(seconds: number): IAutoMovieTransform;
  }
}
