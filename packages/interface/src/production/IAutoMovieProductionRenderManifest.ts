import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionPublicationIdentity } from "./IAutoMovieProductionPublicationIdentity";
import { IAutoMovieProductionRenderedDeliverable } from "./IAutoMovieProductionRenderedDeliverable";

/**
 * Aggregate final-delivery ledger bound to one exact render-plan runtime.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Makes any plan or runtime-closure change invalidate the aggregate publication.
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-deliverable-provenance Preserves the exact render-plan provenance beside delivered bytes.
 * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Carries a recomputable structured publication identity rather than trusting an opaque path.
 * @evidence specifications/execution-and-recovery/artifacts-and-atomic-publication.md#execution-publication-preconditions Supplies the exact candidate generation checked at the terminal commit boundary.
 */
export interface IAutoMovieProductionRenderManifest {
  /**
   * Aggregate manifest format.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Versions the plan-bound manifest contract.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Selects the structured-provenance schema.
   */
  version: 2;
  /**
   * Exact builder input that produced every listed output.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Invalidates the manifest after builder-input change.
   * @evidence specifications/execution-and-recovery/artifacts-and-atomic-publication.md#execution-publication-preconditions Supplies the builder-input precondition.
   */
  compileFingerprint: AutoMovieContentDigest;
  /**
   * Structured and self-verifying render-plan identity.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-runtime-identity Carries the runtime closure.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Supports independent recomputation.
   */
  publication: IAutoMovieProductionPublicationIdentity;
  /**
   * Materialized required and optional deliverables.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-missing-artifact-refusal Enumerates every required delivered artifact.
   * @evidence specifications/validation-and-diagnostics/partial-artifacts-and-refusal.md#validation-preserve-previous-complete Refuses partial replacement of the complete package.
   */
  deliverables: IAutoMovieProductionRenderedDeliverable[];
}
