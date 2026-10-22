import type { IAutoMovieRecoveryContourResumeInput } from "../structures/mesh/IAutoMovieRecoveryContourResumeInput";
import type { IAutoMovieRecoveryContourResumePolicy } from "../structures/mesh/IAutoMovieRecoveryContourResumePolicy";
import type { IAutoMovieRecoverySavedSection } from "../structures/mesh/IAutoMovieRecoverySavedSection";

/** Admit complete saved cuts and distinct failed-target policies before fitting.
 * @evidence contracts/common.md#principled-implementation Finite mesh addresses, frame records, unique planes, raw targets and artifact-bound fit policies are checked structurally. Opaque identities remain caller-attested.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owns preflight; actual source-cut equality remains with the binder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No curve, tolerance, source geometry or policy is corrected.
 * @evidence contracts/common.md#meaningful-documentation States admission scope and caller-owned provenance.
 * @evidence contracts/performance.md#efficient-algorithms Arrays are scanned and sets check uniqueness in expected linear time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate shares no effectful request or result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary sets expire on return; inputs remain borrowed.
 */

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
