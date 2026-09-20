import { IAutoMovieFormationMotion } from "@automovie/interface";

/**
 * Shape one cue's linear progress by its declared curve.
 *
 * Exported because the per-member channel beside the unit-level one authors the
 * same `easing` names and must bend them identically. Two spellings of one
 * curve is how a member and the unit it stands in come to disagree about where
 * they are halfway through the same second.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Evaluates every declared formation easing curve as a pure function of normalized progress.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Shares one curve implementation between unit motion and per-member channels.
 */
export const easingProgress = (
  easing: IAutoMovieFormationMotion["easing"],
  progress: number,
): number => {
  switch (easing) {
    case "linear":
      return progress;
    case "easeIn":
      return progress * progress;
    case "easeOut":
      return 1 - (1 - progress) * (1 - progress);
    case "easeInOut":
      return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    case "step":
      // `sampleFormationMotion` applies a cue's exact `to` state before
      // interpolation once time reaches `end`, so interpolation only observes
      // progress below one.
      return 0;
  }
};
