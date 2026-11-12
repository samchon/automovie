/**
 * Reserved scene-group name used by buildSpaceObject and buildScene's lookup.
 *
 * Implementation: Provides one exact string identity for the viewer-created space group; callers using Three name lookup must keep this reserved name distinct from authored model names.
 * Design: Keeps the shared naming contract in one constant rather than repeating a literal between space construction and scene lookup.
 * Shortcuts: The reserved viewer group name is a supported structural identity, not a consumer/fixture exception or substitution of a foreign method.
 * Documentation: Identifies the producer and lookup consumer and records the reserved-name collision premise.
 * Cost: Reading the fixed string takes constant work and storage; it chooses no traversal or numeric algorithm.
 * Reuse: All space groups and their lookup share the same immutable module value, with no derived cache or invalidation required.
 * Lifetime: The module retains one fixed string for its lifetime and owns no scene object, GPU resource or task.
 */
export const SPACE_GROUP_NAME: string = "__automovie_space";
