/**
 * Build-time proof that {@link bodyRegionBones} partitions the whole rig.
 *
 * The value says nothing; the type above is the guard. It is exported because
 * an unread private constant is a build error, and the proof has to be read by
 * something. Declared plainly `true` rather than carrying the conditional, so
 * the emitted declaration does not republish the three region tuples and the
 * aliases over them: a downstream builder would otherwise re-evaluate the
 * proof against whichever `@automovie/interface` it resolves, and read 55 bone
 * literals to learn the type of a constant that is `true`.
 *
 * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Proves that named body-region owners cover every declared humanoid bone exactly once.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Guards the complete channel partition assumed by region-mask composition.
 */
export const AUTOMOVIE_RIG_IS_PARTITIONED: true = RIG_IS_PARTITIONED;

/** The proof itself: `true` only while nothing escaped the partition. */
const RIG_IS_PARTITIONED: UnregionedBone extends never ? true : UnregionedBone =
  true;
