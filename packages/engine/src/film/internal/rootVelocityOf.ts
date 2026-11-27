import {
  IAutoMovieMotion,
  IAutoMovieSceneNode,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { positiveModulo } from "../../math/internal/positiveModulo";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";
import { VELOCITY_DT } from "../VELOCITY_DT";
import { foldRoot } from "./foldRoot";

/**
 * World root velocity of a node playing `clip` at clip-local `localTime`, in
 * metres per second, from a backward difference of the clip's root folded
 * through the node's staged placement.
 *
 * The window ends at `localTime` and spans {@link VELOCITY_DT} where it can. A
 * looping clip's root jumps back at the seam, so the window never crosses it:
 * within a cycle it is the trailing `VELOCITY_DT`, in the cycle's first
 * instants it shrinks to `[0, phase]`, and exactly on the seam it measures the
 * cycle's closing stretch with the clip sampled unlooped, so reading `duration`
 * does not wrap to the cycle start. A one-shot clip sampled at or before its
 * end uses the same trailing window clamped at zero, and a sample after its end
 * answers zero because the pose is held. A window of zero length, such as a
 * one-shot at time zero, answers zero.
 *
 * `resolveBeatSnapshot` stores the result as an actor's `rootVelocity`, the
 * momentum the next beat continues.
 *
 * @param node Scene node whose staged transform the root is folded through.
 * @param clip Motion the node plays.
 * @param localTime Clip-local seconds the velocity is measured at.
 * @returns World velocity in metres per second.
 */
export function rootVelocityOf(
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  localTime: number,
): IAutoMovieVector3 {
  if (clip.loop && clip.duration > 0) {
    const phase: number = positiveModulo(localTime, clip.duration);
    if (phase >= VELOCITY_DT)
      return velocityOver(node, clip, phase - VELOCITY_DT, phase);
    if (phase > 0) return velocityOver(node, clip, 0, phase);
    const unlooped: IAutoMovieMotion = { ...clip, loop: false };
    return velocityOver(
      node,
      unlooped,
      Math.max(0, clip.duration - VELOCITY_DT),
      clip.duration,
    );
  }
  if (localTime > clip.duration) return { x: 0, y: 0, z: 0 };
  const t1: number = Math.min(Math.max(localTime, 0), clip.duration);
  return velocityOver(node, clip, Math.max(0, t1 - VELOCITY_DT), t1);
}

/** The clip's root at `t`, folded through the node's staged placement. */
function worldRootAt(
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  t: number,
): IAutoMovieVector3 {
  return foldRoot(node.transform, AutoMovieEngineMotionSampling.sampleRoot(clip, t)).translation;
}

/** Difference of the world root over `[t0, t1]`; zero for an empty window. */
function velocityOver(
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  t0: number,
  t1: number,
): IAutoMovieVector3 {
  const span: number = t1 - t0;
  if (span <= 0) return { x: 0, y: 0, z: 0 };
  return Vector3.scale(
    Vector3.subtract(worldRootAt(node, clip, t1), worldRootAt(node, clip, t0)),
    1 / span,
  );
}
