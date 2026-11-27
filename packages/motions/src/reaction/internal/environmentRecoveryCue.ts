import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * The staged hazards that cut a walk: a trip on an obstruction and a slip on a
 * surface, each read as the velocity change it hands the body and its
 * direction.
 */
export namespace environmentRecoveryCue {
  /*
   * How far the displayed toe may be from the obstruction at the cue, metres
   * (provisional: a toe visibly touching it).
   */
  export const CONTACT: number = 0.025;

  /*
   * The least forward toe speed that can trip, metres per second (provisional:
   * a swing, not a foot at rest).
   */
  export const SWING: number = 0.02;

  /*
   * The least sliding speed of a slipping sole that sets the slide's direction,
   * metres per second; slower slides go along the heading (provisional).
   */
  export const SLIDE: number = 0.02;

  /*
   * The share of the swinging foot's forward speed the trip hands the body as a
   * velocity change (provisional).
   */
  export const TRIP_SHARE: number = 0.28;

  /*
   * The share of the excess horizontal load a slip hands the body as a velocity
   * change, seconds (provisional).
   */
  export const SLIP_SHARE: number = 0.18;

  /*
   * A measured cue: its source, velocity change and direction.
   */
  export interface ICue {
    /*
     * The named source: the obstruction, the support prop or `floor`.
     */
    source: string;

    /*
     * The velocity change, metres per second.
     */
    severity: number;

    /*
     * Its horizontal unit direction.
     */
    direction: IAutoMovieVector3;
  }

  /*
   * A trip: the swinging toe within `CONTACT` of the obstruction and moving
   * forward faster than `SWING` hands the body `TRIP_SHARE` of that speed along
   * the heading.
   * Parameter source: The obstruction.
   * Parameter nearest: The toe's distance to it, metres.
   * Parameter forward: The toe's forward speed along the heading, m/s.
   * Parameter yaw: The walker's heading, degrees.
   * Returns: The cue.
   * When the toe is clear of it or not swinging forward.
   */
  export function trip(
    source: string,
    nearest: number,
    forward: number,
    yaw: number,
  ): ICue {
    if (nearest > CONTACT || forward <= SWING)
      throw refuse(
        "obstacle",
        source,
        "the displayed forward swing is clear of the named object at this cue",
      );
    return {
      source,
      severity: TRIP_SHARE * forward,
      direction: HumanFrame.forward(yaw),
    };
  }

  /*
   * A slip: a bearing sole whose required friction exceeds the surface's
   * coefficient hands the body `SLIP_SHARE` of its horizontal load relative to
   * the support, scaled by the friction's shortfall `1 - μ / μ_required`, along
   * its slide (along the heading when it barely slides).
   * Parameter source: The support prop or `floor`.
   * Parameter relative: The load's acceleration relative to the support, m/s².
   * Parameter carried: The sole's velocity relative to the support, m/s.
   * Parameter coefficient: The surface's friction coefficient.
   * Parameter required: The friction the load requires.
   * Parameter yaw: The walker's heading, degrees.
   * Returns: The cue.
   * When the surface can still carry the sole.
   */
  export function slip(
    source: string,
    relative: IAutoMovieVector3,
    carried: IAutoMovieVector3,
    coefficient: number,
    required: number,
    yaw: number,
  ): ICue {
    if (required === Infinity || required <= coefficient)
      throw refuse(
        "coefficient",
        coefficient,
        "the staged surface can still carry the displayed foot at this cue",
      );
    const motion: IAutoMovieVector3 = { x: carried.x, y: 0, z: carried.z };
    return {
      source,
      severity:
        SLIP_SHARE *
        Math.hypot(relative.x, relative.z) *
        (1 - coefficient / required),
      direction:
        Vector3.length(motion) > SLIDE
          ? Vector3.normalize(motion)
          : HumanFrame.forward(yaw),
    };
  }

  /*
   * The recovery's parameter refusal.
   * Parameter axis: The refused parameter.
   * Parameter value: Its value.
   * Parameter reason: Why it is refused.
   * Returns: The refusal.
   */
  export function refuse(
    axis: string,
    value: unknown,
    reason: string,
  ): AutoMovieMotionHumanRefusal {
    return new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis,
      value,
      reason,
      fix: "use a compatible source and outcome at the actual walking contact cue",
    });
  }
}
