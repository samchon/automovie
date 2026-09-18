import { IAutoMovieMotion, IAutoMovieSceneNode, IAutoMovieVector3 } from "@automovie/interface";
import { VELOCITY_DT } from "./VELOCITY_DT";

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
