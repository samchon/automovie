import type { AuthoredLayer } from "../AuthoredLayer";

/**
 * Every authored layer, canon first and then in pipeline order.
 *
 * Principled implementation: The array enumerates both canon layers, settings and brief, then treatments, scripts and screenplay in upstream-to-downstream authoring order.
 * Clear and simple design: Stage validation iterates the same five-layer vocabulary without reconstructing it; each route selects its own subset.
 * Prohibited implementation shortcuts: The literal layers express supported domain responsibility and do not depend on caller or fixture identities.
 * Meaningful documentation: The prose states the canon-first ordering needed by consumers.
 * Efficient algorithms: Initialization stores a fixed five-element array; iteration is bounded by that vocabulary.
 * Reuse equivalent work: The readonly-typed module collection is reused by consumers; it represents immutable domain vocabulary rather than input-dependent computed work.
 * Bound retention and release resources: The module owns one fixed-size collection for its lifetime with no input-driven growth, handle or task.
 */
export const AUTHORED_LAYERS: readonly AuthoredLayer[] = [
  "settings",
  "brief",
  "treatments",
  "scripts",
  "screenplay",
];
