import type { AuthoredLayer } from "../AuthoredLayer";

/**
 * Every authored layer, in pipeline order.
 *
 * Principled implementation: The array enumerates settings, treatments, scripts and screenplay in upstream-to-downstream authoring order.
 * Clear and simple design: Dependency and claim factories use the same four-layer ordering without reconstructing it.
 * Prohibited implementation shortcuts: The literal layers express supported domain responsibility and do not depend on caller or fixture identities.
 * Meaningful documentation: The prose states the ordering or expression-versus-plan distinction needed by consumers.
 * Efficient algorithms: Initialization stores a fixed four-element array or two-element set; iteration is bounded by that vocabulary and set membership is expected constant time.
 * Reuse equivalent work: The readonly-typed module collection is reused by consumers; it represents immutable domain vocabulary rather than input-dependent computed work.
 * Bound retention and release resources: The module owns one fixed-size collection for its lifetime with no input-driven growth, handle or task.
 */
export const AUTHORED_LAYERS: readonly AuthoredLayer[] = [
  "settings",
  "treatments",
  "scripts",
  "screenplay",
];
