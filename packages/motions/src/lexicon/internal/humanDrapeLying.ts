import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDrape,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";

/*
 * A drape's own staging in the carrier contact's frame: the body lies face down
 * across the seat, its trunk level and pointing to the head's side (yaw +90 for
 * a head to the left, -90 to the right, pitch 90), the hips resting a trunk's
 * half depth above the seat and folded so the legs hang, the arms and head
 * hanging (`HANGING`); it is laid over `lay` (0.6 s by default), then draped
 * for the authored seconds, the seat borne on the carrier from `laid`.
 * Parameter params: The drape's times, carrier and head side.
 * Parameter chestDepth: The body's chest depth, metres.
 * Parameter from: The entry posture in the carrier's frame.
 * Returns: The drape's length, cue, seat window and lying posture.
 * When the drape has no length or the lay is negative.
 */
export function humanDrapeLying(
  params: Pick<IAutoMovieMotionHumanDrape, "duration" | "lay" | "on" | "head">,
  chestDepth: number,
  from: IAutoMovieMotionHumanPosture,
): humanDrapeLying.IDrape {
  const lay: number = params.lay ?? 0.6;
  HumanBound.above("duration", params.duration, 0, "s");
  HumanBound.least("lay", lay, 0, "s");
  const sign: number = (params.head ?? "left") === "left" ? 1 : -1;
  const duration: number = lay + params.duration;
  return {
    lay,
    duration,
    events: [{ name: "laid", share: lay / duration }],
    contacts: [
      {
        part: "seat",
        kind: "bear",
        from: lay / duration,
        to: 1,
        support: { kind: "prop", subject: params.on },
      },
    ],
    lying: {
      ...from,
      root: { x: 0, y: chestDepth / 2, z: 0 },
      yaw: sign * 90,
      pitch: 90,
      roll: 0,
      joints: { ...humanDrapeLying.HANGING },
      limbs: {},
    },
  };
}

/*
 * The drape's staging.
 */
export namespace humanDrapeLying {
  /*
   * The hanging joints, degrees: hips folded so the legs hang, shoulders flexed
   * so the arms hang, the neck bent (provisional).
   */
  export const HANGING: IAutoMovieMotionHumanPosture["joints"] = {
    leftUpperLeg: [90, 0, 0],
    rightUpperLeg: [90, 0, 0],
    leftLowerLeg: [10, 0, 0],
    rightLowerLeg: [10, 0, 0],
    leftUpperArm: [90, 0, 0],
    rightUpperArm: [90, 0, 0],
    leftLowerArm: [10, 0, 0],
    rightLowerArm: [10, 0, 0],
    neck: [30, 0, 0],
  };

  /*
   * The drape.
   */
  export interface IDrape {
    /*
     * The laying movement's seconds.
     */
    lay: number;

    /*
     * The whole drape's seconds.
     */
    duration: number;

    /*
     * The `laid` cue.
     */
    events: IAutoMovieMotionEvent[];

    /*
     * The seat borne on the carrier.
     */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /*
     * The lying posture in the carrier's frame.
     */
    lying: IAutoMovieMotionHumanPosture;
  }
}
