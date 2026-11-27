import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeCourse } from "../../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import type { EquineFootwork } from "./EquineFootwork";
import type { EquineJump } from "./EquineJump";
import { EquinePitch } from "./EquinePitch";
import type { QuadrupedRidePose } from "../quadruped/QuadrupedRidePose";
import type { QuadrupedStridePlan } from "../quadruped/QuadrupedStridePlan";

/**
 * A planned jump's events on one assembled ride's film clock, and the swings
 * its flight carries.
 */
export namespace EquineFlightClock {
  /**
   * A planned jump's events on the film clock of one assembled ride: the
   * push-off, final hind liftoff, first fore landing and the end of the landing
   * stance, the published jump cues, and the trunk's pitch through them.
   *
   * @param flight The planned flight, or undefined for a ride without a jump.
   * @param strides The assembled stride plan.
   * @param centre The body's rest centre of mass, model metres, about which the
   *   trunk turns in flight.
   * @returns The flight's seconds, cues and trunk pitch; zeros, no cues and no
   *   pitch without a jump.
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
   * Whether the jump's flight carries a swing: one that lifts before the held
   * phase and lands after it.
   *
   * @param flight The planned flight, if any.
   * @param liftoff The swing's liftoff phase.
   * @param coming The swing's landing phase.
   * @returns True for a swing spanning the hold.
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
   * A hoof's goal at a course state and a swing share, as the hoof track gives
   * it.
   */
  export type IAim = Pick<
    QuadrupedRidePose.IGoal,
    "x" | "z" | "orientation" | "surface"
  >;

  /**
   * The goal of a swing the flying body carries: the hoof leaves with the body,
   * so its goal is its liftoff goal in the body's own frame at liftoff, blended
   * by the swing's progress to its landing goal in the body's frame at landing.
   * The swing travels, rises and turns with the flying body from its own
   * liftoff instead of trailing on the ground the body has left, and the hoof
   * clock's hold keeps it where it is on the trunk. A hoof behind the hips
   * sinks as the trunk turns nose-up about them in the push-off, so the carried
   * hoof is kept on or above the ground, as a swinging hoof rises above a crest
   * (`QuadrupedHoofTrack.target`).
   *
   * @param aim The hoof track's goal at a course state with its displayed
   *   placement, at a swing share.
   * @param shown The course state at a second with the body's displayed
   *   placement.
   * @param current The current course state with the body's displayed
   *   placement.
   * @param liftoff The swing's liftoff second.
   * @param landing The swing's landing second.
   * @param along The swing's progress, zero to one.
   * @returns The carried goal, its support plane the ground's as the current
   *   body sees it.
   */
  export function swing(
    aim: (state: AutoMovieArchetypeCourse.IState, amount: number) => IAim,
    shown: (seconds: number) => AutoMovieArchetypeCourse.IState,
    current: AutoMovieArchetypeCourse.IState,
    liftoff: number,
    landing: number,
    along: number,
  ): IAim {
    const lifted: AutoMovieArchetypeCourse.IState = shown(liftoff);
    const landed: AutoMovieArchetypeCourse.IState = shown(landing);
    const ends: readonly [IAim, IAim] = [aim(lifted, 0), aim(landed, 1)];
    const from: AutoMovieArchetypeQuadrupedFooting.ISurface = floor(ends[0]);
    const to: AutoMovieArchetypeQuadrupedFooting.ISurface = floor(ends[1]);
    const carried: IAutoMovieVector3 = Vector3.lerp(
      from.point,
      to.point,
      along,
    );

    // The ground the hoof left and the ground it lands on, blended in the world and seen from the current body.
    const world = (
      state: AutoMovieArchetypeCourse.IState,
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

  /** One assembly's flight events. */
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
    /**
     * The trunk's planned height and pitch through the jump; absent without a
     * jump.
     */
    pitch?: EquinePitch.IPlan;
  }

  /** A goal's support plane: its own, else the model floor under it. */
  function floor(end: IAim): AutoMovieArchetypeQuadrupedFooting.ISurface {
    return (
      end.surface ?? {
        point: { x: end.x ?? 0, y: 0, z: end.z },
        normal: { x: 0, y: 1, z: 0 },
      }
    );
  }
}
