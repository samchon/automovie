import type { NarrativeLayer } from "./NarrativeLayer";

/**
 * Names every authored layer, including the canon the narrative layers inherit.
 *
 * @evidence contracts/common.md#principled-implementation The union adds settings canon to the three narrative layers, so dependency keys can identify both the documentary parent and its adaptations.
 * @evidence contracts/common.md#clear-and-simple-design Extending NarrativeLayer with settings lets common dependency keys include the documentary canon without a separate parallel key type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the four supported layer literals are admitted; this alias supplies no runtime branch or ownership inference.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes settings canon from inherited narrative layers.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Authored layer identity is an erased TypeScript shape, so it selects no runtime algorithm; its producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authored layer identity declares data only and coordinates no requests or reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Authored layer identity acquires no resource or retained state; concrete object owners, not this erased declaration, determine retained bytes and lifetimes.
 */
export type AuthoredLayer = "settings" | NarrativeLayer;
