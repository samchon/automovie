import { IAutoMovieGait, IAutoMovieMotion, IAutoMovieProfile } from "@automovie/interface";
import { gaitMotion } from "./gaitMotion";

const assertUniqueProfileGaitNames = (
  gaits: readonly IAutoMovieGait[],
): void => {
  const seen = new Set<string>();
  for (const gait of gaits) {
    if (seen.has(gait.name))
      throw new Error(`duplicate profile gait name ${gait.name}`);
    seen.add(gait.name);
  }
};

/**
 * Bind a profile's gait set ({@link IAutoMovieProfile.gaits}) onto a concrete
 * skeleton, synthesising each named gait into a clip for **this** body. The
 * point of a profile binding: the _same_ profile applied to a horse skeleton
 * and a pony skeleton yields each its own gait clips, so one declarative gait
 * set drives many bodies. Returns the clips keyed by gait name (empty when the
 * profile declares no gaits).
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Applies every named profile gait to the selected skeleton without embedding creature-specific code.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Expands a reusable compact gait set into skeleton-bound motion clips.
 * @author Samchon
 */
export const bindProfileGaits = (
  profile: IAutoMovieProfile,
  skeleton: string,
  samples: number,
): Record<string, IAutoMovieMotion> => {
  const gaits = profile.gaits ?? [];
  assertUniqueProfileGaitNames(gaits);
  const clips: Record<string, IAutoMovieMotion> = {};
  for (const gait of gaits)
    clips[gait.name] = gaitMotion(
      `${profile.id}:${gait.name}`,
      skeleton,
      gait,
      samples,
    );
  return clips;
};
