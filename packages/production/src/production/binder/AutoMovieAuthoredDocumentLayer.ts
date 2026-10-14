import { type AutoMovieAuthoredDocumentLayer as EvidenceAuthoredDocumentLayer } from "@automovie/evidence";

/**
 * Authored Markdown layers admitted by the reader binder, using the shared evidence layer schema.
 *
 * @evidence contracts/common.md#principled-implementation Exposes the evidence-owned closed authored-layer union used by binder admission without inventing another layer list.
 * @evidence contracts/common.md#clear-and-simple-design One existing public type connects binder requests to the shared evidence layer schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller-specific layer spelling is added and runtime constructor membership still checks untrusted values.
 * @evidence contracts/common.md#meaningful-documentation Documents authored-layer reader meaning and shared union provenance rather than claiming execution from a type alone.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The alias executes no algorithm; constructor and readers own actual work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no cross-request result or source-byte equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no handle, document population or running task.
 */
export type AutoMovieAuthoredDocumentLayer = EvidenceAuthoredDocumentLayer;
