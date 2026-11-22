import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { ArchetypeCourse } from "../core";
import type { EquineFootwork } from "./EquineFootwork";
import type { EquineJump } from "./EquineJump";
import { EquinePitch } from "./EquinePitch";
import type { QuadrupedFooting } from "./QuadrupedFooting";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";

/**
 * A planned jump's events on one assembled ride's film clock, and the swings its flight carries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member.
 * @evidence contracts/development/design.md#principled-representation Film seconds, cue instants, the trunk's planned pitch and body-frame swing goals in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideQuadruped`'s assembly through `of`, `carries` and `swing`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace EquineFlightClock {
  /**
   * A planned jump's events on the film clock of one assembled ride: the push-off, final hind liftoff, first fore landing and the end of the landing stance, the published jump cues, and the trunk's pitch through them.
   *
   * @param flight The planned flight, or undefined for a ride without a jump.
   * @param strides The assembled stride plan.
   * @param centre The body's rest centre of mass, model metres, about which the trunk turns in flight.
   * @returns The flight's seconds, cues and trunk pitch; zeros, no cues and no pitch without a jump.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each output and the case without a jump.
   * @evidence contracts/development/implementation.md#principled-implementation Each event's phase is read through the assembly's own phase-to-seconds map, so a hold shifts every later event. The trunk's height and pitch through the jump are EquinePitch's plan about the centre of mass, continuous in height, pitch and their rates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Kept apart from `rideQuadruped` for its size.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Six phase reads and one pitch plan per assembly.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stride plan's `secondsAt`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one small record.
   */
  export function of(
    flight: EquineJump.IFlight | undefined,
    strides: QuadrupedStridePlan.IPlan,
    centre: IAutoMovieVector3,
  ): IClock {
    if (flight === undefined)
      return { push: 0, takeoff: 0, landing: 0, absorb: 0, instants: [] };
    const push: number = strides.secondsAt(flight.push);
    const takeoff: number = strides.secondsAt(flight.takeoff);
    const landing: number = strides.secondsAt(flight.landing);
    const absorb: number = strides.secondsAt(flight.absorb);
    return {
      push,
      takeoff,
      landing,
      absorb,
      pitch: EquinePitch.plan(
        { y: centre.y, z: centre.z },
        push,
        takeoff,
        landing,
        absorb,
      ),
      instants: [
        { seconds: strides.secondsAt(flight.approach), label: "jumpApproach" },
        { seconds: takeoff, label: "jumpTakeoff" },
        { seconds: landing, label: "jumpLanding" },
        { seconds: strides.secondsAt(flight.recovery), label: "jumpRecovery" },
      ],
    };
  }

  /**
   * Whether the jump's flight carries a swing: one that lifts before the held phase and lands after it.
   *
   * @param flight The planned flight, if any.
   * @param liftoff The swing's liftoff phase.
   * @param coming The swing's landing phase.
   * @returns True for a swing spanning the hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A swing spanning the held phase is in the air while the body flies, so the body carries it from its own liftoff (`swing`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the flight's held phase.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean.
   */
  export function carries(
    flight: EquineJump.IFlight | undefined,
    liftoff: number,
    coming: number,
  ): boolean {
    return (
      flight !== undefined && liftoff <= flight.phase && coming > flight.phase
    );
  }

  /**
   * A hoof's goal at a course state and a swing share, as the hoof track gives it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Model metres and the terminal's orientation and support.
   * @evidence contracts/development/design.md#principled-representation The hoof track's goal fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read and returned by `swing`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type IAim = Pick<
    QuadrupedRidePose.IGoal,
    "x" | "z" | "orientation" | "surface"
  >;

  /**
   * The goal of a swing the flying body carries: the hoof leaves with the body, so its goal is its liftoff goal in the body's own frame at liftoff, blended by the swing's progress to its landing goal in the body's frame at landing. The swing travels, rises and turns with the flying body from its own liftoff instead of trailing on the ground the body has left, and the hoof clock's hold keeps it where it is on the trunk. A hoof behind the hips sinks as the trunk turns nose-up about them in the push-off, so the carried hoof is kept on or above the ground, as a swinging hoof rises above a crest (`QuadrupedHoofTrack.target`).
   *
   * @param aim The hoof track's goal at a course state with its displayed placement, at a swing share.
   * @param shown The course state at a second with the body's displayed placement.
   * @param current The current course state with the body's displayed placement.
   * @param liftoff The swing's liftoff second.
   * @param landing The swing's landing second.
   * @param along The swing's progress, zero to one.
   * @returns The carried goal, its support plane the ground's as the current body sees it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames, the blend and the ground bound.
   * @evidence contracts/development/implementation.md#principled-implementation The two ends are the hoof track's own goals at the body's actual placements then, so the goal meets the stance goal at liftoff and at landing. Between them the body-frame position and orientation blend by the swing's progress (a plane the track leaves as the model floor is that floor). The support plane is the two footholds' ground, blended in the world and turned into the current body's frame, so the solid's clearance is measured from the ground; a carried contact below that plane is raised onto it along its normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two goal reads, one blend and one plane bound.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The footholds are the track's; only the path between them follows the body, and the ground bound only raises.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two goal reads, only for a carried swing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the hoof track's goal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one goal.
   */
  export function swing(
    aim: (state: ArchetypeCourse.IState, amount: number) => IAim,
    shown: (seconds: number) => ArchetypeCourse.IState,
    current: ArchetypeCourse.IState,
    liftoff: number,
    landing: number,
    along: number,
  ): IAim {
    const lifted: ArchetypeCourse.IState = shown(liftoff);
    const landed: ArchetypeCourse.IState = shown(landing);
    const ends: readonly [IAim, IAim] = [aim(lifted, 0), aim(landed, 1)];
    const from: QuadrupedFooting.ISurface = floor(ends[0]);
    const to: QuadrupedFooting.ISurface = floor(ends[1]);
    const carried: IAutoMovieVector3 = Vector3.lerp(
      from.point,
      to.point,
      along,
    );

    // The ground the hoof left and the ground it lands on, blended in the world and seen from the current body.
    const world = (
      state: ArchetypeCourse.IState,
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(state.placement.rotation, local);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      current.placement.rotation,
    );
    const ground: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(
        Vector3.lerp(
          Vector3.add(lifted.placement.translation, world(lifted, from.point)),
          Vector3.add(landed.placement.translation, world(landed, to.point)),
          along,
        ),
        current.placement.translation,
      ),
    );
    const normal: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(
        inverse,
        Vector3.lerp(
          world(lifted, from.normal),
          world(landed, to.normal),
          along,
        ),
      ),
    );
    // A contact below that ground is raised onto it along its normal.
    const contact: IAutoMovieVector3 = Vector3.addScaled(
      carried,
      normal,
      Math.max(0, Vector3.dot(Vector3.subtract(ground, carried), normal)),
    );
    return {
      ...(ends[0].x === undefined || ends[1].x === undefined
        ? {}
        : { x: contact.x }),
      z: contact.z,
      orientation: Quaternion.slerp(
        ends[0].orientation ?? Quaternion.identity(),
        ends[1].orientation ?? Quaternion.identity(),
        along,
      ),
      surface: { point: contact, normal },
    };
  }

  /** A goal's support plane: its own, else the model floor under it. */
  function floor(end: IAim): QuadrupedFooting.ISurface {
    return (
      end.surface ?? {
        point: { x: end.x ?? 0, y: 0, z: end.z },
        normal: { x: 0, y: 1, z: 0 },
      }
    );
  }

  /**
   * One assembly's flight events.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation Seconds, instants and a pitch plan present only with a jump.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ride's body placement, tucks and instants.
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
    /** The trunk's planned height and pitch through the jump; absent without a jump. */
    pitch?: EquinePitch.IPlan;
  }
}
