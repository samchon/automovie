import typia from "typia";

import type { IAutoMovieHumanFaceFacialHair } from "../../structures/IAutoMovieHumanFaceFacialHair";

/**
 * Admit named visible terminal-shaft targets without converting clinical records.
 * Count follows the existing hair allocator's per-population resource limit;
 * this limit does not define a biological density. No requested scalar is
 * clamped or replaced. Source coverage is decided by the subsequent resolver.
 *
 * @evidence contracts/common.md#principled-implementation Closed schema and finite unit-bearing targets are checked before source or geometry allocation.
 * @evidence contracts/common.md#clear-and-simple-design One admission owner is shared by numerical document load/save and production resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses invalid targets without inventing clinical bounds or narrowing a requested population.
 * @evidence contracts/common.md#meaningful-documentation Separates resource admission, authored quantities and later source coverage.
 * @evidence contracts/anatomy.md#parametric-authority Only named site counts, metric dimensions, styling angle, seed and reflected finish enter.
 * @author Samchon
 */
export function assertHumanFaceFacialHair(input: IAutoMovieHumanFaceFacialHair): void {
  const hair = typia.assertEquals<IAutoMovieHumanFaceFacialHair>(input);
  for (const profile of Object.values(hair.sites)) {
    if (profile === undefined) continue;
    if (!Number.isInteger(profile.count) || profile.count < 0 || profile.count > 1024 ||
        !Number.isInteger(profile.seed) || profile.seed < 0 || profile.seed > 0xffffffff ||
        !Number.isFinite(profile.lengthMm) || profile.lengthMm < 0 ||
        !Number.isFinite(profile.diameterMicrometres) || profile.diameterMicrometres <= 0 ||
        !Number.isFinite(profile.emergenceAngleDegrees) || profile.emergenceAngleDegrees <= 0 || profile.emergenceAngleDegrees > 90 ||
        !Number.isFinite(profile.flowAngleDegrees) || profile.flowAngleDegrees < -180 || profile.flowAngleDegrees > 180 ||
        !Number.isFinite(profile.samplingStepMm) || profile.samplingStepMm <= 0 || profile.samplingStepMm > 5 ||
        Object.values(profile.finish).some((value) => !Number.isFinite(value) || value < 0 || value > 1))
      throw new Error("Facial terminal shafts need finite admitted counts, metric dimensions, styling angle, seed and finish.");
  }
}
