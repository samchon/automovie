
import typia from "typia";
import { canonicalAutoMovieCaptureRuntimeIdentity } from "./canonicalAutoMovieCaptureRuntimeIdentity";
import { canonicalizeAutoMovieJson } from "./contentIdentity";
import { IAutoMovieSubjectInspectionObservationRecord } from "./IAutoMovieSubjectInspectionObservationRecord";
import { subjectInspectionIsContentDigest } from "./subjectInspectionIsContentDigest";

/**
 * Admit one v2 per-view passed record with exact repeated context and runtime fields.
 *
 * @evidence contracts/common.md#principled-implementation Strict schema, nonblank context, digest syntax, positive safe attempt and repeated target/revision/pose/runtime equality qualify the record.
 * @evidence contracts/common.md#clear-and-simple-design Record admission precedes current-plan/artifact-byte verification in the separate verifier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A passed per-view marker is not an overall passed sweep, and this parser neither reopens pixels nor proves a current host.
 * @evidence contracts/common.md#meaningful-documentation Nested receipt and outer metadata must join exactly; runtime canonicalization can throw.
 * @evidence contracts/performance.md#efficient-algorithms Schema traversal and repeated canonical pose/runtime serialization dominate this fixed-field wrapper.
 * @evidence contracts/performance.md#reuse-equivalent-work One validated input supplies all joins and is forwarded without rebuilding its receipt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record aliases validated input while comparison strings are temporary; no artifact buffer or external handle is retained.
 */
export function parseAutoMovieSubjectInspectionObservation(
  value: unknown
): IAutoMovieSubjectInspectionObservationRecord {
  const validation: typia.IValidation.IFailure | typia.IValidation.ISuccess<IAutoMovieSubjectInspectionObservationRecord> =
    typia.validateEquals<IAutoMovieSubjectInspectionObservationRecord>(value);
  if (validation.success === false)
    throw new Error(
      `Invalid AutoMovie subject-inspection observation: ${validation.errors
        .map((error: typia.IValidation.IError) : string => `${error.path} expects ${error.expected}`)
        .join("; ")}`,
    );
  const record: IAutoMovieSubjectInspectionObservationRecord = validation.data;
  if (
    record.productionId.trim().length === 0 ||
    record.target.shot.trim().length === 0 ||
    record.target.subject.trim().length === 0 ||
    record.revision.trim().length === 0 ||
    subjectInspectionIsContentDigest(record.compileFingerprint) === false ||
    subjectInspectionIsContentDigest(record.planIdentity) === false ||
    Number.isSafeInteger(record.attempt) === false ||
    record.attempt <= 0 ||
    record.viewpoint !== record.observation.viewpoint ||
    record.productionId !== record.observation.productionId ||
    record.target.shot !== record.observation.target.shot ||
    record.target.subject !== record.observation.target.subject ||
    record.revision !== record.observation.revision ||
    record.compileFingerprint !== record.observation.compileFingerprint ||
    record.planIdentity !== record.observation.planIdentity ||
    record.target.subject !== record.observation.subject ||
    record.observation.kind !== "subject-view" ||
    canonicalizeAutoMovieJson(record.pose) !==
      canonicalizeAutoMovieJson(record.observation.pose) ||
    canonicalizeAutoMovieJson(record.runtimeIdentity) !==
      canonicalizeAutoMovieJson(record.observation.runtimeIdentity) ||
    record.observation.artifact.trim().length === 0 ||
    subjectInspectionIsContentDigest(record.observation.digest) === false
  )
    throw new Error(
      "Subject-inspection observation does not preserve one exact passed context and content-addressed artifact.",
    );
  canonicalAutoMovieCaptureRuntimeIdentity(record.runtimeIdentity);
  return record;
}
