import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionRenderReceiptFile } from "./IAutoMovieProductionRenderReceiptFile";

/**
 * Renderer-owned aggregate receipt bound to current output bytes.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-deliverable-provenance Preserves renderer-owned evidence for the final package.
 * @evidence specifications/execution-and-recovery/artifacts-and-atomic-publication.md#execution-atomic-current-commit Binds manifest, receipt, and bytes to one current commit.
 */
export interface IAutoMovieProductionRenderReceipt {
  /**
   * Receipt format.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Versions the plan-bound receipt contract.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Selects the publication-fingerprint receipt schema.
   */
  version: 4;

  /**
   * Exact digest of the active production's tracked render manifest.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Detects manifest-byte change.
   * @evidence specifications/execution-and-recovery/artifacts-and-atomic-publication.md#execution-atomic-current-commit Joins the receipt to the committed manifest bytes.
   */
  manifestDigest: AutoMovieContentDigest;

  /**
   * Exact recomputed publication identity carried by the manifest.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-runtime-identity Carries the runtime-bound publication digest.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Joins the independently parsed receipt and manifest identities.
   */
  publicationFingerprint: AutoMovieContentDigest;

  /**
   * Exact byte and media probes in canonical path order.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-missing-artifact-refusal Requires the exact complete delivered-file population.
   * @evidence specifications/validation-and-diagnostics/partial-artifacts-and-refusal.md#validation-resume-verified-artifacts Allows reuse only after all receipt rows verify.
   */
  files: IAutoMovieProductionRenderReceiptFile[];
}
