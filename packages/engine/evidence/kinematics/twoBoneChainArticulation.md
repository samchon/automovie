# src/kinematics/twoBoneChainArticulation.ts#twoBoneChainArticulation

## @evidence contracts/development/implementation.md#principled-implementation

Places the mid joint by the law-of-cosines lift in a chosen plane, then lowers each world delta into its bone's local frame by conjugation with the rest world rotation; the premises are a resolved chain whose rest frames match the bones' current world frames and unit rotations, and the stated limitation is that without `bendNormal` the plane is a world-down heuristic that suits a knee but not every joint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Private source geometry, target geometry and candidate evaluation are the shared owners used by this direct entry and explicit scoped preparation; solvePreparedChainPlant keeps clinical decomposition and solveTwoBoneIK keeps the triangle law.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No limb or rig is special-cased; the vertical-axis fallback plane is a stated degeneracy rule, and an unreachable target is extended onto the shell rather than reported as reached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant direct work includes the triangle solve, two ordinary aims and quaternion products, with no prepared-aim closures on that one-shot path. Explicit source preparation also shares two unchanged source-direction validations/normalizations across all target/normal candidates, while every actual target direction and shortest arc still runs. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The direct entry derives actual source and target each call. Explicit preparation shares source lengths/rest directions/inverses and aimRotation.prepare's source-only readings across targets, and one target shares its reach triangle across normals. First-use aim admission retains its original stage; every candidate still has fresh upper/lower rotations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Private fixed-size source/target records end with this direct call; only fresh upper/lower quaternions escape, with no input reference or handle retained.

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured from the chain, how the bend plane is chosen including both fallbacks, how deltas become bone-local, the unreachable behavior, the free-swing caveat and the hinge alternative, every `null` case with its threshold, and each input's frame.
