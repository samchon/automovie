
import * as AutomovieRigIsPartitionedData from "./internal/AutomovieRigIsPartitionedData";

/**
 * Build-time proof that {@link bodyRegionBones} partitions the whole rig.
 *
 * The value says nothing; the type above is the guard. It is exported because
 * an unread private constant is a build error, and the proof has to be read by
 * something. Declared plainly `true` rather than carrying the conditional, so
 * the emitted declaration does not republish the three region tuples and the
 * aliases over them: a downstream builder would otherwise re-evaluate the proof
 * against whichever `@automovie/interface` it resolves, and read 55 bone
 * literals to learn the type of a constant that is `true`.
 */
export const AUTOMOVIE_RIG_IS_PARTITIONED: true = AutomovieRigIsPartitionedData.RIG_IS_PARTITIONED;
