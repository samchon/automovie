/**
 * Population-model controls of a subject from its recorded facts.
 *
 * The face basis carries the source's population model (MPFB's macro axes):
 * `globalAgeStructure`, `globalSexualDimorphism` and, from the population
 * revision, one share per ancestry. A subject's recorded age, sex and
 * ancestry set them by the source's own definitions, so they are facts
 * transcribed, not values fitted to a photograph:
 *
 * - Age. MakeHuman maps years to its age macro piecewise linearly, 1 year at
 *   0, 25 at 0.5 and 90 at 1 (`makehuman/apps/human.py`, `setAgeYears`:
 *   `(years - 1) / 48` below 25, `0.5 + (years - 25) / 130` above). The
 *   basis sampled the macro at 0.25 and 1 around 0.5 (extraction receipt
 *   `macroSource`), so the channel is `(macro - 0.5) / 0.25` below and
 *   `(macro - 0.5) / 0.5` above: 13 years at -1, 25 at 0, 90 at 1. A
 *   younger subject is held at -1 and the row says so.
 * - Sex. The gender macro is 0 for female and 1 for male and the basis
 *   sampled both ends, so female is -1 and male 1; an unrecorded sex is 0,
 *   the source's midpoint.
 * - Ancestry. The share of the recorded ancestry is one, replacing the
 *   source's equal mixture; an unrecorded ancestry keeps the mixture.
 *
 * Pure.
 */

/** One subject's recorded facts. */
export interface IFacePopulationFacts {
  ageYears: number | null;
  sex: "female" | "male" | null;
  ancestry: "african" | "asian" | "european" | null;
}

/** Ancestry -> the basis channel of its share. */
export const FACE_POPULATION_ANCESTRY_CHANNELS = {
  african: "africanAncestry",
  asian: "asianAncestry",
  european: "europeanAncestry",
} as const;

/** Population-model shape controls and whether the age was held. */
export function facePopulationControls(facts: IFacePopulationFacts): {
  shape: Record<string, number>;
  ageHeld: boolean;
} {
  const shape: Record<string, number> = {};
  let ageHeld = false;
  if (facts.ageYears !== null) {
    if (!(facts.ageYears >= 1 && facts.ageYears <= 90))
      throw new Error("A recorded age lies between 1 and 90 years.");
    const macro =
      facts.ageYears < 25
        ? (facts.ageYears - 1) / 48
        : 0.5 + (facts.ageYears - 25) / 130;
    const channel = macro < 0.5 ? (macro - 0.5) / 0.25 : (macro - 0.5) / 0.5;
    ageHeld = channel < -1;
    shape.globalAgeStructure = Math.max(-1, channel);
  }
  if (facts.sex !== null)
    shape.globalSexualDimorphism = facts.sex === "male" ? 1 : -1;
  if (facts.ancestry !== null)
    shape[FACE_POPULATION_ANCESTRY_CHANNELS[facts.ancestry]] = 1;
  return { shape, ageHeld };
}
