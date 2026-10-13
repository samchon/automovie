/**
 * The parent key under which a skeleton topology lists its null-parent root
 * bones.
 *
 * No humanoid bone carries this name, so it cannot collide with a real parent.
 * {@link indexSkeletonTopology} files roots under it and {@link resolvePose}
 * starts its walk from it, so both read the one spelling.
 */
export const SKELETON_ROOT_PARENT = "__root__" as const;
