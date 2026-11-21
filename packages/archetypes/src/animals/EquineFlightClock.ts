import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArchetypeCourse } from "../core";
import type { EquineFootwork } from "./EquineFootwork";
import { EquineJump } from "./EquineJump";
import type { QuadrupedHoofTrack } from "./QuadrupedHoofTrack";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";

/**
 * A planned jump's events on one assembled ride's film clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member.
 * @evidence contracts/development/design.md#principled-representation Film seconds, cue instants and a world displacement in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideQuadruped`'s assembly through `of`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace EquineFlightClock {
  /**
   * A planned jump's events on the film clock of one assembled ride: the push-off, final hind liftoff, first fore landing and the end of the landing stance, the published jump cues, and the body displacement over the held flight.
   *
   * @param flight The planned flight, or undefined for a ride without a jump.
   * @param strides The assembled stride plan.
   * @param plan The course plan.
   * @returns The flight's seconds, cues and hold displacement; zeros, no cues and no displacement without a jump.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each output and the case without a jump.
   * @evidence contracts/development/implementation.md#principled-implementation Each event's phase is read through the assembly's own phase-to-seconds map, so a hold shifts every later event; the displacement is the course's over the hold.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Kept apart from `rideQuadruped` for its size.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Six phase reads and two course reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stride plan's `secondsAt`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one small record.
   */
  export function of(
    flight: EquineJump.IFlight | undefined,
    strides: QuadrupedStridePlan.IPlan,
    plan: ArchetypeCourse.IPlan,
  ): IClock {
    if (flight === undefined)
      return { push: 0, takeoff: 0, landing: 0, absorb: 0, instants: [] };
    const takeoff: number = strides.secondsAt(flight.takeoff);
    const landing: number = strides.secondsAt(flight.landing);
    return {
      push: strides.secondsAt(flight.push),
      takeoff,
      landing,
      absorb: strides.secondsAt(flight.absorb),
      instants: [
        { seconds: strides.secondsAt(flight.approach), label: "jumpApproach" },
        { seconds: takeoff, label: "jumpTakeoff" },
        { seconds: landing, label: "jumpLanding" },
        { seconds: strides.secondsAt(flight.recovery), label: "jumpRecovery" },
      ],
      shift: Vector3.subtract(
        plan.at(flight.hold.start + flight.hold.duration).placement.translation,
        plan.at(flight.hold.start).placement.translation,
      ),
    };
  }

  /**
   * The body displacement that carries one swing through the jump's held flight, when the swing spans the hold.
   *
   * @param flight The planned flight, if any.
   * @param shift The body's world displacement over the hold, metres.
   * @param seconds The film second.
   * @param liftoff The swing's liftoff phase.
   * @param coming The swing's landing phase.
   * @returns The carry, or undefined for a swing outside the hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A swing that lifts before the held phase and lands after it is carried by the hold's displacement in proportion to the hold's elapsed share, so the hoof keeps its place under the body while the clock stands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One test and one share.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the flight's hold.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one small record.
   */
  export function carry(
    flight: EquineJump.IFlight | undefined,
    shift: IAutoMovieVector3 | undefined,
    seconds: number,
    liftoff: number,
    coming: number,
  ): QuadrupedHoofTrack.ICarry | undefined {
    if (
      flight === undefined ||
      shift === undefined ||
      !(liftoff <= flight.phase && coming > flight.phase)
    )
      return undefined;
    const share: number = (seconds - flight.hold.start) / flight.hold.duration;
    return { shift, share: Math.max(0, Math.min(1, share)) };
  }

  /**
   * One assembly's flight events.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation Seconds, instants and an optional displacement present only with a jump.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ride's body placement, carry and instants.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IClock {
    /** Film second both hinds are down for the push-off. */
    push: number;
    /** Film second of final hind liftoff. */
    takeoff: number;
    /** Film second of first fore landing. */
    landing: number;
    /** Film second the first fore stance ends. */
    absorb: number;
    /** The published jump cues. */
    instants: readonly EquineFootwork.IInstant[];
    /** World displacement of the body over the held flight, metres; absent without a jump. */
    shift?: IAutoMovieVector3;
  }
}
