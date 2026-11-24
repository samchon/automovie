import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * How far a shank leans forward from vertical, degrees, for an ankle at a point
 * below a hip, with the knee bent forward in the plane of the facing: the
 * two-link leg's closed form. A law that moves an ankle turns the foot by the
 * change of this lean, so the ankle keeps its angle and a foot that bears
 * nothing never dorsiflexes past what it held.
 *
 * @param body The leg's lengths.
 * @param hip The hip joint, world metres.
 * @param ankle The ankle, world metres.
 * @param facing The unit horizontal facing.
 * @returns The shank's forward lean from the vertical, degrees, within a right
 *   angle either way, positive with the knee ahead of the ankle.
 */
export function shankTilt(
  body: shankTilt.ILeg,
  hip: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  facing: IAutoMovieVector3,
): number {
  const thigh: number = body.measure.thigh;
  const shank: number = body.measure.shank;
  const reach: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
  const forward: number = Vector3.dot(reach, facing);
  const down: number = reach.y;
  const span: number = Math.min(
    thigh + shank,
    Math.max(Math.abs(thigh - shank), Math.hypot(forward, down)),
  );
  const toward: number = Math.atan2(forward, -down);
  const opening: number = Math.acos(
    Math.min(
      1,
      Math.max(
        -1,
        (thigh * thigh + span * span - shank * shank) / (2 * thigh * span),
      ),
    ),
  );
  const kneeForward: number = thigh * Math.sin(toward + opening);
  const kneeDown: number = -thigh * Math.cos(toward + opening);
  // Read against the vertical either way, so a shank folded above its
  // ankle, as a leg swung over a saddle folds, leans at most a right angle
  // and turns through it without a jump.
  return (
    Math.atan2(kneeForward - forward, Math.abs(kneeDown - down)) /
    Quaternion.DEG2RAD
  );
}

/** Companion types of {@link shankTilt}. */
export namespace shankTilt {
  /** What the lean reads of a body: its leg's two lengths. */
  export interface ILeg {
    /** The thigh and shank lengths, metres. */
    measure: Pick<IAutoMovieBodyMeasure, "thigh" | "shank">;
  }
}
