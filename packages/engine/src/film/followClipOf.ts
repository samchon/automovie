import { IAutoMovieClip } from "@automovie/interface";

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
