

/**
 * World position or look target in meters, in right-handed Y-up coordinates.
 *
 * @evidence contracts/common.md#principled-implementation A fixed XYZ tuple matches the Three camera setters and production camera arrays; finite coordinates remain a producer premise rather than a constraint enforced by this erased type.
 * @evidence contracts/common.md#clear-and-simple-design The common tuple keeps tour eye and target coordinates in one representation without an executable wrapper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source identity or observed camera value changes the tuple shape.
 * @evidence contracts/common.md#meaningful-documentation The comment states coordinate order, units and handedness needed at the camera boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased tuple chooses no processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased tuple coordinates no requests or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased tuple acquires no resources or retained state.
 */
export type Point = [number, number, number];
