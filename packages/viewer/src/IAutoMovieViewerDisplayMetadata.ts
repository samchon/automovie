/**
 * Facts from the owner of an actually completed interactive display.
 * Application identity and requested values remain separate from observations.
 * This transport record establishes no review acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Records loaded revision, actual native renderer and completed display address/camera as observations, keeping application requests separate from the facts of a drawn viewport.
 * @evidence contracts/common.md#clear-and-simple-design Required provenance fields give the display transport a shared minimum while the unknown-valued index signature permits application-owned facts without pretending they are a universal schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Metadata cannot substitute requested camera or document state for completed observations and makes no visual-review acceptance claim.
 * @evidence contracts/common.md#meaningful-documentation Identifies actual loaded source, native device, displayed application identity, observed camera and the distinction between transport facts and review acceptance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The transport record performs no capture, encoding or filesystem work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fact serialization and publication equivalence are decided by display owners, not by this extensible record type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Metadata holds provenance values without owning a framebuffer, bitmap or GPU context.
 */
export interface IAutoMovieViewerDisplayMetadata {
  /** Actual loaded application source identity. */
  revision: string;

  /** Native device reported by the completed producer. */
  renderer: string;

  /** Application-owned displayed document, model, pass and view identity. */
  address: object;

  /** Actual camera pose and projection sampled at completion. */
  camera: object;

  /** Separately identified requests or other application-owned facts. */
  [key: string]: unknown;
}
