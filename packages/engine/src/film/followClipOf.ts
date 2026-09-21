import { IAutoMovieClip } from "@automovie/interface";

/**
 * When one of the coupling pass's baked clips starts speaking for `node`.
 * `followClipOf` only receives entries kept under that same child id by
 * `coupleObjects`; `compileAttach` and the mount baker always emit a non-empty
 * translation/rotation pair for it. Keep that producer invariant explicit
 * instead of carrying unreachable malformed-clip branches in this internal
 * selector.
 */
const drivingStart = (clip: IAutoMovieClip, node: string): number =>
  clip.tracks.find(
    (track) =>
      track.channel.kind === "node" &&
      track.channel.node === node &&
      track.channel.path === "translation",
  )!.times[0]!;

/**
 * The baked clip that supplies a chained coupling's parent transform for
 * `node`, or `null` when none does.
 *
 * `coupleObjects` already groups these clips by the child they drive. The
 * latest clip to start wins, so a chained coupling composes through the last
 * parent handoff without interpreting its artifact id. Ties go to the later
 * producer entry.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects followClipOf selects the baked parent transform source needed to continue a chained object coupling for the addressed node.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff followClipOf realizes declared attachment and object handoff: The baked clip that supplies a chained coupling's parent transform for `node`, or `null` when none does. `coupleObjects` already groups these clips by the child they drive. The latest clip to start wins, so a chained coupling composes through the last parent handoff without interpreting its artifact id. Ties go to the later producer entry.
 * @author Samchon
 */
export const followClipOf = (
  objectMotions: readonly IAutoMovieClip[],
  node: string,
): IAutoMovieClip | null => {
  let best: IAutoMovieClip | null = null;
  let bestStart = -Infinity;
  for (const clip of objectMotions) {
    const start = drivingStart(clip, node);
    if (start >= bestStart) {
      best = clip;
      bestStart = start;
    }
  }
  return best;
};
