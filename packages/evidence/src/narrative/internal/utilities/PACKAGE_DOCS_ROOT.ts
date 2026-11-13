/**
 * Names the package's docs folder.
 *
 * Authored claims select the body through `BODY_ROOT`. The instruction and
 * review relations use this constant directly, because their documents sit
 * beside the body rather than in it.
 *
 * Principled implementation: The literal docs string is the package-relative document directory shared by the body root and the instruction and review locations, rather than a resolved filesystem identity.
 * Clear and simple design: One constant supplies the common directory spelling while BODY_ROOT names the authored body inside it.
 * Prohibited implementation shortcuts: The docs directory is a declared production layout value; it is not selected from fixture names, measured output or host-specific paths.
 * Meaningful documentation: The prose identifies which consumers use the constant directly and which select the body through BODY_ROOT.
 * Efficient algorithms: The string initializer is constant-sized and performs no filesystem or population traversal.
 * Reuse equivalent work: Consumers reuse the same immutable string, so no equivalent derivation or invalidation mechanism is needed unless the source layout contract changes.
 * Bound retention and release resources: One fixed string is retained for module lifetime; it has no dynamic population, file handle or task to release.
 */
export const PACKAGE_DOCS_ROOT: string = "docs";
