import { IAutoMovieSemanticMaskReceipt } from "../../render/IAutoMovieSemanticMaskReceipt";
import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";

/**
 * Provenance returned for one verified capture that reopens through its committed current bundle.
 *
 * @evidence contracts/common.md#principled-implementation Capture receipt binds exact registry target and compile identity to target-local fingerprint, canonical capture runtime, bundle path and PNG digest, retaining the semantic-mask dependency only for a shot mask.
 * @evidence contracts/common.md#clear-and-simple-design One compact identity record links the portable tool result to verified bundle bytes without duplicating every frame or renderer configuration field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A receipt must reopen against current target and frame identity; a shot mask requires its exact semantic dependency and every other product carries null rather than an unrelated sidecar.
 * @evidence contracts/common.md#meaningful-documentation Defines production and target identity, compile versus local freshness, capture runtime, content-addressed bundle, exact output digest and mask-null semantics.
 * @author Samchon
 */
export interface IAutoMovieCaptureReceipt {
  /** Receipt format. */
  version: 2;

  /** Production namespace used to resolve the registry target. */
  productionId: string;

  /** Exact evidence target. */
  target: AutoMovieCaptureTarget;

  /** Current builder-owned target registry fingerprint. */
  compileFingerprint: string;

  /** Target-local render fingerprint from the verified bundle manifest. */
  targetFingerprint: string;

  /** Canonical structured capture-runtime identity. */
  rendererIdentity: string;

  /** Content-addressed project-relative render bundle. */
  bundle: string;

  /** Verified PNG digest. */
  outputDigest: string;

  /** Semantic dependency of a shot mask, or null for every other product. */
  semanticMask: IAutoMovieSemanticMaskReceipt | null;
}
