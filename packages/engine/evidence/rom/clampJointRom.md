# src/rom/clampJointRom.ts#clampJointRom

## @evidence contracts/development/implementation.md#principled-implementation

Project finite-or-repaired axes into admitted intervals, force specified immobile axes to zero, preserve null rest and blend swing toward the box-nearest-neutral point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Axis projection and combined swing are distinct constraints; swingConeBlend supplies fixed bisection and the result preserves bone identity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Specified nonfinite angles reset to neutral before box projection; unrestricted multi-turn overrides can violate swing monotonicity, so universal box/cone projection is not certified. For a swing-twist joint the edge tolerance `EDGE` (a millionth of a degree) only absorbs the rounding of reading a rotation back into angles, so a joint on the edge clamps to itself; it hides no real overshoot.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify nonfinite repair, null/immobile distinction, degrees and finite ordered constraint premise with remaining cone limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three clamps and at most forty fixed swing iterations cost constant work and one fixed-size result. A swing-twist joint costs one overshoot test and, only outside the range, one projection and one decomposition, reading the cached radius table. Explicit prepared frames share their one admitted basis instead of repeating raw-axis comparisons in composition and readback; ordinary frames retain both original admission calls. Runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Targeted/full-pose clamps reuse the same joint owner and borrow constraints; changed angles need new projection. Explicit unchanged-operation frames lend their lazy admitted axes to the existing OnBasis composition/inverse, keeping every clinical angle/frame check and the first admission's jointToQuaternion diagnostic. Swing-twist readback lends that same constraint to the inverse's shared box-preparation owner instead of cloning another box here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller receives a value: the input record when already in range (no allocation), else one fresh record. Existing swing-region and inverse box metadata remain weakly keyed by their owning constraint/basis records; no projected answer, pose population, native handle or task is retained.
