import type { IAutoMovieRecoveryCurvatureAdmission } from "../structures/internal/IAutoMovieRecoveryCurvatureAdmission";

/**
 * Admit requested curvature bookkeeping and conservative simultaneous buffers.
 *
 * @evidence contracts/common.md#principled-implementation Monotone checked scalar-entry bounds add F=256, S=4E+256 and A=8(C^2+3LC+9L+Zw+n+E+1)+8192 to unchanged base retention. Eligible models retain the full envelope through direction/auxiliary work; no unproved GN-factor dominance removes A.
 * @evidence contracts/common.md#clear-and-simple-design Requested setup pays512 fixed visits before checked arithmetic and record creation. The caller skips this operation entirely when the option is absent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ceiling increase, resident-to-materialization substitution, refunded failed attempt or milliseconds claim supplies eligibility. Invalid dimensions and aggregate charge errors propagate.
 * @evidence contracts/common.md#meaningful-documentation Positive C,L,E and nonnegative intermediate products are safe integers. Base+F is mandatory for requested fixed records; insufficient optional S+A or maxLinearEntries gives explicit ineligibility and GN.
 * @evidence contracts/performance.md#efficient-algorithms Fewer than128 fixed arithmetic/validation/record visits fit the prepaid512 setup. The returned full-attempt bound separately covers fixed local E work and LC^2+C^3+EC^2+LC+C^2+n+E work; per-model bookkeeping and generic wrappers have their own32 charges.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fit computes one envelope from fixed dimensions without caching results across fits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one fixed admission record transfers. No dimension-sized buffer is allocated before resident and individual materialization limits admit its complete envelope.
 */
export function admitRecoveryMapCurvature(
  cameraWidth: number,
  points: number,
  observations: number,
  baseRetained: number,
  maxResidentEntries: number,
  maxLinearEntries: number,
  charge: (work: number) => void,
): IAutoMovieRecoveryCurvatureAdmission {
  charge(512);
  if (
    !Number.isSafeInteger(baseRetained) ||
    baseRetained < 1 ||
    !Number.isSafeInteger(maxResidentEntries) ||
    maxResidentEntries < 1 ||
    !Number.isSafeInteger(baseRetained + 256) ||
    baseRetained + 256 > maxResidentEntries
  )
    throw new Error("camera-curvature: bounded requested metadata required");
  if (
    ![
      cameraWidth,
      points,
      observations,
      baseRetained,
      maxResidentEntries,
      maxLinearEntries,
    ].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    )
  )
    throw new Error("camera-curvature: positive safe fit bounds required");
  const width: number = cameraWidth + 3 * points;
  const coefficients: number = width + observations * (cameraWidth + 3);
  const seed: number = 4 * observations + 256;
  const optional: number =
    8 *
      (cameraWidth ** 2 +
        3 * points * cameraWidth +
        9 * points +
        coefficients +
        width +
        observations +
        1) +
    8192;
  const fixed: number = baseRetained + 256;
  const complete: number = fixed + seed + optional;
  const work: number =
    131072 * (observations + 1) +
    128 *
      (points * cameraWidth ** 2 +
        cameraWidth ** 3 +
        observations * cameraWidth ** 2 +
        points * cameraWidth +
        cameraWidth ** 2 +
        width +
        observations +
        1);
  if (
    ![width, coefficients, seed, optional, fixed, complete, work].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    fixed > maxResidentEntries
  )
    throw new Error("camera-curvature: bounded requested metadata required");
  const eligible: boolean =
    complete <= maxResidentEntries && optional <= maxLinearEntries;
  return { eligible, retainedEntries: eligible ? complete : fixed, work };
}
