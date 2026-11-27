import type { IAutoMovieMotionHumanEnsemblePreset } from "@automovie/interface";

/**
 * Named groups as distributions of their members' attributes and proficiency,
 * so an elite battalion and a militia are one composition under two names.
 *
 * Every value here is provisional: no study measuring the spread of discipline,
 * fatigue or morale across a unit was located. The rows order the groups as the
 * period sources and the crowd literature describe them: drilled regulars
 * steadier and more uniform than militia, a rabble the least disciplined and
 * the most varied, and civilians undrilled but calm. The scene tests assert
 * relations between the rows (elite narrower than militia, rabble wider than
 * civilians), never the rows' own numbers.
 */
export const HUMAN_ENSEMBLE_PRESETS: Readonly<
  Record<
    IAutoMovieMotionHumanEnsemblePreset.Name,
    IAutoMovieMotionHumanEnsemblePreset
  >
> = {
  elite: {
    proficiency: { mean: 0.9, spread: 0.05 },
    attributes: {
      discipline: { mean: 0.95, spread: 0.03 },
      fatigue: { mean: 0.2, spread: 0.1 },
      morale: { mean: 0.9, spread: 0.05 },
    },
  },
  line: {
    proficiency: { mean: 0.7, spread: 0.1 },
    attributes: {
      discipline: { mean: 0.75, spread: 0.08 },
      fatigue: { mean: 0.3, spread: 0.12 },
      morale: { mean: 0.75, spread: 0.1 },
    },
  },
  militia: {
    proficiency: { mean: 0.4, spread: 0.15 },
    attributes: {
      discipline: { mean: 0.4, spread: 0.15 },
      fatigue: { mean: 0.35, spread: 0.15 },
      morale: { mean: 0.55, spread: 0.15 },
    },
  },
  rabble: {
    proficiency: { mean: 0.25, spread: 0.15 },
    attributes: {
      discipline: { mean: 0.1, spread: 0.08 },
      fatigue: { mean: 0.4, spread: 0.2 },
      morale: { mean: 0.35, spread: 0.2 },
    },
  },
  civilians: {
    proficiency: { mean: 0.4, spread: 0.2 },
    attributes: {
      discipline: { mean: 0.2, spread: 0.1 },
      fatigue: { mean: 0.25, spread: 0.15 },
      morale: { mean: 0.7, spread: 0.15 },
    },
  },
};
