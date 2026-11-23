import type {
  IAutoMovieRecoveryContourResumeInput,
  IAutoMovieRecoveryContourResumePolicy,
  IAutoMovieRecoverySavedSection,
} from "@automovie/interface";

/** Admit complete saved cuts and distinct failed-target policies before fitting. */

export function validateRecoveryContourResume(
  input: IAutoMovieRecoveryContourResumeInput,
): boolean {
  if (
    !input ||
    !text(input.name) ||
    !text(input.sourceIdentity) ||
    !text(input.sourceSelectionIdentity) ||
    !finiteVector(input.axis) ||
    !finiteVector(input.reference) ||
    typeof input.exactCoordinateAliases !== "boolean" ||
    !Array.isArray(input.verticesMm) ||
    !input.verticesMm.length ||
    !Array.from(input.verticesMm).every(finiteVector) ||
    !Array.isArray(input.triangles) ||
    !input.triangles.length ||
    !Array.from(input.triangles).every(
      (triangle: number[]): boolean =>
        Array.isArray(triangle) &&
        triangle.length === 3 &&
        [0, 1, 2].every(
          (index: number): boolean =>
            Number.isSafeInteger(triangle[index]) &&
            triangle[index]! >= 0 &&
            triangle[index]! < input.verticesMm.length,
        ),
    )
  )
    return false;
  if (
    !Array.isArray(input.savedSections) ||
    !input.savedSections.length ||
    !Array.from(input.savedSections).every(
      (saved: IAutoMovieRecoverySavedSection): boolean =>
        !!saved &&
        Number.isFinite(saved.coordinateMm) &&
        text(saved.sourceIdentity) &&
        text(saved.sourceSelectionIdentity) &&
        text(saved.observationIdentity) &&
        typeof saved.exactCoordinateAliases === "boolean" &&
        !!saved.frame &&
        [
          saved.frame.originMm,
          saved.frame.n,
          saved.frame.u,
          saved.frame.v,
        ].every(finiteVector) &&
        Array.isArray(saved.sourceLineage),
    )
  )
    return false;
  if (
    new Set(
      input.savedSections.map(
        (saved: IAutoMovieRecoverySavedSection): number => saved.coordinateMm,
      ),
    ).size !== input.savedSections.length
  )
    return false;
  if (
    !Array.isArray(input.targets) ||
    !input.targets.length ||
    !Array.from(input.targets).every(
      (
        target: IAutoMovieRecoveryContourResumeInput["targets"][number],
      ): boolean =>
        !!target &&
        Number.isFinite(target.coordinateMm) &&
        Number.isSafeInteger(target.contourIndex) &&
        target.contourIndex >= 0,
    ) ||
    new Set(
      input.targets.map(
        (
          target: IAutoMovieRecoveryContourResumeInput["targets"][number],
        ): string => address(target.coordinateMm, target.contourIndex),
      ),
    ).size !== input.targets.length
  )
    return false;
  return (
    Array.isArray(input.fitPolicies) &&
    input.fitPolicies.length > 0 &&
    Array.from(input.fitPolicies).every(
      (policy: IAutoMovieRecoveryContourResumePolicy): boolean =>
        !!policy &&
        text(policy.observationIdentity) &&
        Number.isFinite(policy.toleranceMm) &&
        policy.toleranceMm > 0 &&
        Number.isFinite(policy.cornerDegrees) &&
        policy.cornerDegrees > 0 &&
        policy.cornerDegrees < 180 &&
        (policy.sourceOrientationSign === 1 ||
          policy.sourceOrientationSign === -1) &&
        Number.isSafeInteger(policy.originalMaxSpans) &&
        policy.originalMaxSpans > 0,
    ) &&
    new Set(
      input.fitPolicies.map(
        (policy: IAutoMovieRecoveryContourResumePolicy): string =>
          policy.observationIdentity,
      ),
    ).size === input.fitPolicies.length
  );
}

function finiteVector(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    [0, 1, 2].every((index: number): boolean => Number.isFinite(value[index]))
  );
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function address(coordinateMm: number, contourIndex: number): string {
  return `${coordinateMm}/${contourIndex}`;
}
