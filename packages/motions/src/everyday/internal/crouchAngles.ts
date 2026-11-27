import type { IAutoMovieMotionHumanCrouch } from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";
import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * A crouch's leg angles at its lowest pose: the shank tilts forward by the
 * crouching ankle's dorsiflexion (no more than the ankle's range) plus the heel
 * lift, and the thigh by the rest of the depth's knee flexion, refused where
 * that leaves the hip's flexion range no room before the trunk inclines.
 *
 * @param knee The depth's knee flexion, degrees.
 * @param ankle The crouching ankle's dorsiflexion, degrees.
 * @param heel The heel lift, degrees; none with the heels flat.
 * @param depth The depth asked, for the refusal.
 * @param heels The heels asked, for the refusal.
 * @returns The ankle's dorsiflexion, the shank's and the thigh's tilts and the
 *   hip's flexion range, degrees.
 * @throws {HumanRefusal} On `depth` where the thigh's tilt reaches the hip's
 *   flexion range.
 */
export function crouchAngles(
  knee: number,
  ankle: number,
  heel: number,
  depth: IAutoMovieMotionHumanCrouch.Depth,
  heels: IAutoMovieMotionHumanCrouch.Heels,
): crouchAngles.IAngles {
  const dorsiflexion: number = Math.min(
    ankle,
    AutoMovieMotionHumanRange.limit("leftFoot", "flexion") ?? 0,
  );
  const hipRange: number =
    AutoMovieMotionHumanRange.limit("leftUpperLeg", "flexion") ?? 0;
  const shankTilt: number = dorsiflexion + heel;
  const thighTilt: number = knee - shankTilt;
  if (thighTilt >= hipRange)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "depth",
      value: depth,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: hipRange + shankTilt,
        unit: "degrees",
        open: "maximum",
      },
      reason: `a ${depth} crouch with the heels ${heels} needs ${thighTilt.toFixed(0)} degrees of hip flexion before the trunk inclines, past the ${hipRange} degree range; with these heels the knee flexion must stay under ${(hipRange + shankTilt).toFixed(0)} degrees${heels === "flat" ? ", or raise the heels" : ""}`,
      fix: `choose a shallower depth${heels === "flat" ? ", or raise the heels" : ""}`,
    });
  return { dorsiflexion, shankTilt, thighTilt, hipRange };
}

/** A crouch's leg angles. */
export namespace crouchAngles {
  /** The leg's angles at the lowest pose, degrees. */
  export interface IAngles {
    /** The ankle's dorsiflexion. */
    dorsiflexion: number;

    /** The shank's forward tilt. */
    shankTilt: number;

    /** The thigh's forward tilt. */
    thighTilt: number;

    /** The hip's flexion range. */
    hipRange: number;
  }
}
