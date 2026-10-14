/**
 * Preserves the selection/reversal input with exact attempt identity, authored reason, structural review and nullable continuity evidence.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the selection/reversal input with exact attempt identity, authored reason, structural review and nullable continuity evidence.
 * @evidence contracts/common.md#clear-and-simple-design The existing selection/reversal shape remains separate from provider request controls because selection persists review of a resident candidate without dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation The admitted clone owns review metadata only and does not synthesize a provider execution or select pixels.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; typia.equals and a structured clone admit the existing shape before context/project effects; the interface itself performs no work.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The admitted clone owns review metadata only and does not synthesize a provider execution or select pixels.
 */
export interface IAutoMovieProductionRepaintSelectionInput {
  /** Names the owning production namespace checked before project/provider effects. */
  productionId: string;

  /** Names the exact shot whose deterministic source and rendition contract apply. */
  shot: string;

  /** Returns or records a distinct provider-attempt identity within the immutable request lineage. */
  attemptId: string;

  /** Distinguishes selection from reversal while preserving the existing exact selection schema. */
  kind: "selection" | "reversal";

  /** Carries the authored reason persisted with selection/reversal provenance. */
  reason: string;

  /** Addresses the authored structural review required by the project selection contract. */
  structuralReview: string;

  /** Optionally carries the authored continuity review; null remains the original absence state. */
  continuityReview: {
    /** Addresses the deterministic continuity baseline used by the authored review. */
    baseline: string;

    /** Addresses reviewed playback evidence rather than synthesizing a playback observation. */
    playbackEvidence: string;

    /** Optionally addresses the authored mixed-delivery policy; null preserves absence. */
    mixedDeliveryPolicy: string | null;

    /** Records the authored pass assertion for flicker, not a measured result produced by this type. */
    flicker: "pass";

    /** Records the authored pass assertion for identity drift, not an automated visual certification. */
    identityDrift: "pass";

    /** Records the authored pass assertion for geometry warp without changing deterministic geometry authority. */
    geometryWarp: "pass";

    /** Records the authored pass assertion for texture crawl, not a generated measurement. */
    textureCrawl: "pass";

    /** Records the authored pass assertion for transitions, not an executed playback test. */
    transitionMismatch: "pass";
  } | null;
}
