import { ViolationCollector, validateTransformScalars } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Append shared raw-transform findings to artifact admission.
 *
 * TRS components must be finite, scale strictly positive and quaternion norm within 1e-6 of one. Malformed nested fields are reported independently and no rotation is normalized to pass.
 *
 * @evidence contracts/common.md#principled-implementation The engine's unknown-input transform gate owns shape, finite components, positive scale and the collector's shared 1e-6 quaternion-norm policy.
 * @evidence contracts/common.md#clear-and-simple-design This adapter transfers the engine findings into the artifact sink, removing the artifact-specific scalar and quaternion validator copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No transform is repaired, normalized or assigned a caller-specific tolerance to pass admission.
 * @evidence contracts/common.md#meaningful-documentation States scalar domains, quaternion tolerance, malformed-field collection and unmodified input behavior.
 * @evidence contracts/performance.md#efficient-algorithms A fixed TRS record produces a bounded number of checks/findings; refusal text adds path, label and represented-value costs, with arbitrary host conversion hooks carrying no execution-time bound. No scene or model population is traversed here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One current transform is checked per call and no cross-observation verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local collector's bounded findings transfer to the caller-owned array before it is released; no private state or resource survives.
 */
export function validateTransformArtifact(
  transform: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void {
  const collector: ViolationCollector = new ViolationCollector();
  validateTransformScalars({ transform, path, label, collector });
  violations.push(...collector.items);
}
