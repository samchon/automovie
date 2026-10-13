import typia from "typia";

import type { IAutoMovieHumanFaceFacialHair } from "../../structures/IAutoMovieHumanFaceFacialHair";

/**
 * Admit named visible terminal-shaft targets without converting clinical records. Count follows the existing hair allocator's per-population resource limit; this limit does not define a biological density. No requested scalar is clamped or replaced. Source coverage is decided by the subsequent resolver.
 *
 * @evidence contracts/common.md#principled-implementation Exact structural admission precedes finite metric, count, seed, angle and finish checks for each named terminal-shaft site.
 * @evidence contracts/common.md#clear-and-simple-design The boundary validates visible shaft targets before a separate resolver establishes available source coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1024 count limit bounds allocation rather than biological density; no scalar is clamped and no clinical record is converted here.
 * @evidence contracts/common.md#meaningful-documentation The function throws on invalid named profiles and leaves source coverage or contact feasibility to construction.
 * @evidence contracts/performance.md#efficient-algorithms Checks are linear in declared site profiles and finish fields after typia structural admission; no geometry is allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work Document admission reuses this same site-boundary validator rather than a separate generation-only policy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary enumeration arrays are call-local, input records stay caller-owned and no material or collider resource is retained.
 *
 * @author Samchon
 */
export function assertHumanFaceFacialHair(input: IAutoMovieHumanFaceFacialHair): void {
  const hair: IAutoMovieHumanFaceFacialHair = typia.assertEquals<IAutoMovieHumanFaceFacialHair>(input);
  for (const profile of Object.values(hair.sites)) {
    if (profile === undefined) continue;
    if (!Number.isInteger(profile.count) || profile.count < 0 || profile.count > 1024 ||
        !Number.isInteger(profile.seed) || profile.seed < 0 || profile.seed > 0xffffffff ||
        !Number.isFinite(profile.lengthMm) || profile.lengthMm < 0 ||
        !Number.isFinite(profile.diameterMicrometres) || profile.diameterMicrometres <= 0 ||
        !Number.isFinite(profile.emergenceAngleDegrees) || profile.emergenceAngleDegrees <= 0 || profile.emergenceAngleDegrees > 90 ||
        !Number.isFinite(profile.flowAngleDegrees) || profile.flowAngleDegrees < -180 || profile.flowAngleDegrees > 180 ||
        !Number.isFinite(profile.samplingStepMm) || profile.samplingStepMm <= 0 || profile.samplingStepMm > 5 ||
        Object.values(profile.finish).some((value: number): boolean => !Number.isFinite(value) || value < 0 || value > 1))
      throw new Error("Facial terminal shafts need finite admitted counts, metric dimensions, styling angle, seed and finish.");
  }
}
