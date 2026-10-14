import { IAutoMovieSemanticMaskReceipt } from "../../render/IAutoMovieSemanticMaskReceipt";
import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";

/**
 * Retained intended receipt for the removed legacy capture result; no current producer or reopening consumer implements this shape.
 *
 * @evidence contracts/common.md#principled-implementation Fields describe the intended registry target, compile/local identities, runtime, bundle and PNG digest, with a semantic dependency for shot masks. Only the retained Frame type currently references this receipt; supplied fields alone establish no verified capture.
 * @evidence contracts/common.md#clear-and-simple-design The retained identity record separates target and byte claims without duplicating full frame/runtime state; active Oracle preview and bundles use their own current contracts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Intended currentness and shot-mask dependency obligations are not currently implemented for this result shape. A digest or bundle path is a supplied claim rather than proof that bytes were reopened, and no replacement host is introduced.
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
