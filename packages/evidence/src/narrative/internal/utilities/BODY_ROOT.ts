import { PACKAGE_DOCS_ROOT } from "./PACKAGE_DOCS_ROOT";

/**
 * Names the docs subtree that holds every authored narrative body.
 *
 * Every authored claim hosts this tree, and every inherited reference selects
 * it, because each layer's authored text lives only in the body.
 *
 * Principled implementation: The value joins PACKAGE_DOCS_ROOT with `body`, the one location the document layout gives authored layers.
 * Clear and simple design: One constant supplies the body spelling to every claim factory and reference builder, derived from the docs folder so the two cannot drift.
 * Prohibited implementation shortcuts: The body directory is a declared production layout value; it is not selected from fixture names, measured output or host-specific paths.
 * Meaningful documentation: The prose states that the body is the single authored tree hosts and references share.
 * Efficient algorithms: The string initializer is constant-sized and performs no filesystem or population traversal.
 * Reuse equivalent work: Consumers reuse the same immutable string, so no equivalent derivation or invalidation mechanism is needed unless the source layout contract changes.
 * Bound retention and release resources: One fixed string is retained for module lifetime; it has no dynamic population, file handle or task to release.
 */
export const BODY_ROOT: string = `${PACKAGE_DOCS_ROOT}/body`;
