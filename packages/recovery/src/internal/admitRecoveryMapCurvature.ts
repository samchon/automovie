import type { IAutoMovieRecoveryCurvatureAdmission } from "@automovie/interface";

/** Admit requested curvature bookkeeping and conservative simultaneous buffers. */
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
    baseRetained < 1 ||
    maxResidentEntries < 1 ||
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
    ].every((value: number): boolean => value > 0)
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
      (value: number): boolean => value > 0,
    ) ||
    fixed > maxResidentEntries
  )
    throw new Error("camera-curvature: bounded requested metadata required");
  const eligible: boolean =
    complete <= maxResidentEntries && optional <= maxLinearEntries;
  return { eligible, retainedEntries: eligible ? complete : fixed, work };
}
