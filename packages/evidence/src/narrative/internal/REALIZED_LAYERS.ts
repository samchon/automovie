import type { AuthoredLayer } from "../AuthoredLayer";

/**
 * Layers that hold literal reader-facing text rather than a plan for it.
 *
 * A treatment fixes which exchange happens and leaves the words to the layers
 * below, so a question about the words themselves can only be asked here.
 *
 * Principled implementation: The set names scripts and screenplay as the only layers holding literal expression rather than documentary plans.
 * Clear and simple design: Naturalness question discovery shares this two-layer eligibility vocabulary.
 * Prohibited implementation shortcuts: The literal layers express supported domain responsibility and do not depend on caller or fixture identities.
 * Meaningful documentation: The prose states the ordering or expression-versus-plan distinction needed by consumers.
 * Efficient algorithms: Initialization stores a fixed four-element array or two-element set; iteration is bounded by that vocabulary and set membership is expected constant time.
 * Reuse equivalent work: The readonly-typed module collection is reused by consumers; it represents immutable domain vocabulary rather than input-dependent computed work.
 * Bound retention and release resources: The module owns one fixed-size collection for its lifetime with no input-driven growth, handle or task.
 */
export const REALIZED_LAYERS: ReadonlySet<AuthoredLayer> =
  new Set<AuthoredLayer>(["scripts", "screenplay"]);
