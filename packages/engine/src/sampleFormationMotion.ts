import { IAutoMovieFormationMotion } from "@automovie/interface";
import { IAutoMovieSampledFormationMotion } from "./IAutoMovieSampledFormationMotion";
import { easingProgress } from "./easingProgress";
import { lerp } from "./lerp";

/**
 * Sample one formation's compact source-authored cue sequence.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Resolves the same translation, facing, spacing, and retained reform state for any direct seek to the same time.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Orders overlapping cue candidates stably and reconstructs state without a playback cursor.
 */
export const sampleFormationMotion = (
  motions: readonly IAutoMovieFormationMotion[],
  formation: string,
  time: number,
): IAutoMovieSampledFormationMotion => {
  const cues = motions
    .filter((cue) => cue.formation === formation)
    .sort(
      (left, right) =>
        left.start - right.start ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    );
  const identity: IAutoMovieSampledFormationMotion = {
    translation: { x: 0, y: 0, z: 0 },
    facingOffsetDeg: 0,
    spacingScale: { lateral: 1, depth: 1 },
    reform: null,
  };
  if (cues.length === 0 || time < cues[0]!.start) return identity;
  // The arrangement the unit is standing in before the next cue moves it: the
  // target of the last cue that finished, held at one, so a unit that
  // re-formed stays re-formed instead of snapping back the moment its cue ends.
  let retained: IAutoMovieSampledFormationMotion = {
    ...cues[0]!.from,
    reform: null,
  };
  for (const cue of cues) {
    if (time < cue.start) return retained;
    if (time < cue.end) {
      const progress = easingProgress(
        cue.easing,
        Math.max(0, Math.min(1, (time - cue.start) / (cue.end - cue.start))),
      );
      return {
        translation: {
          x: lerp(cue.from.translation.x, cue.to.translation.x, progress),
          y: lerp(cue.from.translation.y, cue.to.translation.y, progress),
          z: lerp(cue.from.translation.z, cue.to.translation.z, progress),
        },
        facingOffsetDeg: lerp(
          cue.from.facingOffsetDeg,
          cue.to.facingOffsetDeg,
          progress,
        ),
        spacingScale: {
          lateral: lerp(
            cue.from.spacingScale.lateral,
            cue.to.spacingScale.lateral,
            progress,
          ),
          depth: lerp(
            cue.from.spacingScale.depth,
            cue.to.spacingScale.depth,
            progress,
          ),
        },
        reform:
          cue.layout === undefined
            ? retained.reform
            : { layout: cue.layout, progress },
      };
    }
    retained = {
      ...cue.to,
      reform:
        cue.layout === undefined
          ? retained.reform
          : { layout: cue.layout, progress: 1 },
    };
  }
  return retained;
};
