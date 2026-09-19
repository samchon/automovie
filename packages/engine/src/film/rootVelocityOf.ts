import { IAutoMovieMotion, IAutoMovieSceneNode, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";
import { VELOCITY_DT } from "./constants/VELOCITY_DT";
import { foldRoot } from "./foldRoot";

/**
 * Wrap a non-negative time onto `[0, duration)`, matching the sampler's loop
 * handling. Callers guarantee `seconds >= 0` (a shot's local clock never runs
 * backwards), so no negative-modulo correction is needed.
 */
const wrapTime = (seconds: number, duration: number): number =>
  seconds % duration;

/** The clip's root at `t`, folded through the node's staged placement. */
const worldRootAt = (
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  t: number,
): IAutoMovieVector3 => {
  const root = sampleMotion(clip, t).pose.root;
  return foldRoot(node.transform, root).translation;
};

/**
 * Finite-difference world root velocity of `clip` over `[t0, t1]`, folded
 * through the node's staged placement; zero for an empty window.
 */
const velocityOver = (
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  t0: number,
  t1: number,
): IAutoMovieVector3 => {
  const span = t1 - t0;
  if (span <= 0) return { x: 0, y: 0, z: 0 };
  const p0 = worldRootAt(node, clip, t0);
  const p1 = worldRootAt(node, clip, t1);
  return Vector3.scale(Vector3.subtract(p1, p0), 1 / span);
};

/**
 * World root velocity at `localTime`, finite-differenced over the clip's last
 * instants and folded through the node's staged placement.
 *
 * A looping clip's root teleports back at the seam, so the window never spans
 * it: within a cycle the window is the trailing {@link VELOCITY_DT}; in the
 * cycle's opening instants it shrinks to `[0, phase]`; and exactly on the seam
 * the cycle's closing stretch is measured with the clip clamped (un-looped) so
 * sampling `duration` does not wrap to the cycle start. A non-looping clip
 * sampled exactly at its end uses that same incoming left-hand window for the
 * cut; only a sample after the clip has ended holds its last pose at zero
 * velocity.
 *
 * @evidence requirements/motion/validation-and-determinism.md#motion-fixed-step-baked-state rootVelocityOf converts the sampled clip boundary into an explicit staged world-space velocity for deterministic beat-end replay.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation rootVelocityOf realizes deterministic motion sampling: World root velocity at `localTime`, finite-differenced over the clip's last instants and folded through the node's staged placement. A looping clip's root teleports back at the seam, so the window never spans it: within a cycle the window is the trailing {@link VELOCITY_DT}; in the cycle's opening instants it shrinks to `[0, phase]`; and exactly on the seam the cycle's closing stretch is measured with the clip clamped (un-looped) so sampling `duration` does not wrap to the cycle start. A non-looping clip sampled exactly at its end uses that same incoming left-hand window for the cut; only a sample after the clip has ended holds its last pose at zero velocity.
 */
export const rootVelocityOf = (
  node: IAutoMovieSceneNode,
  clip: IAutoMovieMotion,
  localTime: number,
): IAutoMovieVector3 => {
  if (clip.loop && clip.duration > 0) {
    const phase = wrapTime(localTime, clip.duration);
    if (phase >= VELOCITY_DT)
      return velocityOver(node, clip, phase - VELOCITY_DT, phase);
    if (phase > 0) return velocityOver(node, clip, 0, phase);
    const clamped: IAutoMovieMotion = { ...clip, loop: false };
    const start = Math.max(0, clip.duration - VELOCITY_DT);
    return velocityOver(node, clamped, start, clip.duration);
  }

  if (localTime > clip.duration) return { x: 0, y: 0, z: 0 };
  const t1 = Math.min(Math.max(localTime, 0), clip.duration);
  return velocityOver(node, clip, Math.max(0, t1 - VELOCITY_DT), t1);
};
