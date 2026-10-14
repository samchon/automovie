import { IAutoMovieCurrentSubjectReviewObservation } from "@automovie/engine";
import { IAutoMovieCaptureRuntimeIdentity, IAutoMovieSubjectReviewViewpoint } from "@automovie/interface";
import { canonicalAutoMovieCaptureRuntimeIdentity } from "./canonicalAutoMovieCaptureRuntimeIdentity";
import { canonicalizeAutoMovieJson, digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { IAutoMovieSubjectInspectionPlanRecord } from "./IAutoMovieSubjectInspectionPlanRecord";
import { IAutoMovieSubjectInspectionObservationRecord } from "./IAutoMovieSubjectInspectionObservationRecord";
import { parseAutoMovieSubjectInspectionPlan } from "./parseAutoMovieSubjectInspectionPlan";
import { parseAutoMovieSubjectInspectionObservation } from "./parseAutoMovieSubjectInspectionObservation";
import { inspectionDirectory } from "./inspectionDirectory";

/**
 * Bind a parsed observation to the supplied current plan, pose, runtime and exact artifact bytes.
 *
 * @evidence contracts/common.md#principled-implementation Plan/record admission, ordered viewpoint lookup, expected encoded attempt path, context equality and artifact digest must all agree.
 * @evidence contracts/common.md#clear-and-simple-design The read-side owns physical byte acquisition; this verifier owns exact semantic joins and current observation projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The expected plan/runtime are caller-supplied currentness premises; byte equality does not prove visible content or independently inspect a browser.
 * @evidence contracts/common.md#meaningful-documentation The returned engine coverage record repeats exact target, plan and canonical runtime with a passed per-view verdict.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes both parsers/canonical hashes, a linear viewpoint search and all artifact-byte hashing.
 * @evidence contracts/performance.md#reuse-equivalent-work Parsed plan/record and canonical actual runtime are reused across comparisons; separate observations currently reparse the plan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A fresh projection escapes while nested receipt fields remain borrowed; artifact bytes and comparison text are not retained.
 */
export function verifyAutoMovieSubjectInspectionObservation(
  props: {
  plan: IAutoMovieSubjectInspectionPlanRecord;
  runtimeIdentity: IAutoMovieCaptureRuntimeIdentity;
  record: IAutoMovieSubjectInspectionObservationRecord;
  artifactBytes: Uint8Array;
}
): IAutoMovieCurrentSubjectReviewObservation {
  const record: IAutoMovieSubjectInspectionObservationRecord = parseAutoMovieSubjectInspectionObservation(props.record);
  const plan: IAutoMovieSubjectInspectionPlanRecord = parseAutoMovieSubjectInspectionPlan(props.plan);
  const viewpoint: number = plan.planned.findIndex(
    (candidate: IAutoMovieSubjectReviewViewpoint) : boolean => candidate.id === record.viewpoint,
  );
  const actualRuntime: string = canonicalAutoMovieCaptureRuntimeIdentity(
    record.runtimeIdentity,
  );
  const expectedArtifact: string = `${inspectionDirectory(
    plan.productionId,
    plan.target.shot,
    plan.target.subject,
  )}/${encodeAutoMoviePathSegment(plan.planIdentity)}/attempt-${
    record.attempt
  }/${encodeAutoMoviePathSegment(record.viewpoint)}.png`;
  if (
    record.productionId !== plan.productionId ||
    record.target.shot !== plan.target.shot ||
    record.target.subject !== plan.target.subject ||
    record.revision !== plan.revision ||
    record.compileFingerprint !== plan.compileFingerprint ||
    record.planIdentity !== plan.planIdentity ||
    viewpoint === -1 ||
    canonicalizeAutoMovieJson(record.pose) !==
      canonicalizeAutoMovieJson(plan.poses[viewpoint]) ||
    record.observation.artifact !== expectedArtifact ||
    actualRuntime !==
      canonicalAutoMovieCaptureRuntimeIdentity(props.runtimeIdentity) ||
    digestAutoMovieBytes(props.artifactBytes) !== record.observation.digest
  )
    throw new Error(
      "Subject-inspection observation is stale for the exact current plan, pose, runtime, or artifact bytes.",
    );
  return {
    ...record.observation,
    productionId: record.productionId,
    target: record.target,
    compileFingerprint: record.compileFingerprint,
    planIdentity: record.planIdentity,
    captureRuntimeIdentity: actualRuntime,
    verdict: "passed",
  };
}
