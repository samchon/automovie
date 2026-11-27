import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "./HumanFrame";
import { hipJoints } from "./hipJoints";

/*
 * The highest the hips may ride over a set of ankles: at most the asked height,
 * and low enough that every ankle lies within a near-straight leg's reach of
 * its own hip joint. A body whose feet stand a stride apart cannot keep its
 * standing pelvis height, since the hip-to-ankle distance grows with the
 * horizontal offset; the pelvis lowers by exactly the excess (Pythagoras on the
 * hip joint's horizontal offset from the ankle), as the compass gait's pelvis
 * is lowest in double support, where the legs splay (Saunders, Inman and
 * Eberhart 1953, the compass gait their determinants of gait start from).
 * Parameter body: The body, whose thigh, shank and rest hip joints are read.
 * Parameter hips: The asked hips' world point.
 * Parameter yaw: The pelvis heading, degrees about +Y, with a level pelvis.
 * Parameter ankles: The ankles the legs must reach, world metres, by side.
 * Returns: The hips' height, world metres: the asked one when every ankle is in
 * reach.
 */
export function pelvisReachHeight(
  body: IAutoMovieMotionHumanBody,
  hips: IAutoMovieVector3,
  yaw: number,
  ankles: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
): number {
  const heading: IAutoMovieQuaternion = HumanFrame.turn(yaw);
  const root: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    hips,
    AutoMovieEngineQuaternion.rotateVector(heading, body.rest.get("hips")!),
  );
  const joints: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
    body,
    root,
    heading,
  );
  const reach: number =
    pelvisReachHeight.STRAIGHT * (body.measure.thigh + body.measure.shank);
  let drop: number = 0;
  for (const side of ["left", "right"] as const) {
    const ankle: IAutoMovieVector3 | undefined = ankles[side];
    if (ankle === undefined) continue;
    const hip: IAutoMovieVector3 = joints[side];
    const across: number = Math.hypot(hip.x - ankle.x, hip.z - ankle.z);
    if (!(across < reach)) continue;
    drop = Math.max(
      drop,
      hip.y - ankle.y - Math.sqrt(reach * reach - across * across),
    );
  }
  return hips.y - drop;
}

/*
 * The bound's reach share.
 */
export namespace pelvisReachHeight {
  /*
   * The share of the thigh and shank a leg may span from hip to ankle, keeping
   * the knee off its lock (provisional, as `addressPrecisionStroke`'s planted
   * leg).
   */
  export const STRAIGHT: number = 0.98;
}
