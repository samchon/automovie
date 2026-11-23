# src/kinematics/normalizeJointAxes.ts#normalizeJointAxes

## @evidence contracts/development/implementation.md#principled-implementation

Normalizing each axis by its length turns a validated orthogonal basis into an orthonormal one, the premise every Euler composition and extraction in this module relies on; `Vector3.normalize` rescales extreme components before measuring, so axes that pass the non-zero check never divide by an underflowed length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Turns the issue list of `validateJointAxesBasis`, which retargeting reports as violations, into the throwing guard the quaternion functions need, so the basis rules live in one place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A skewed or degenerate basis throws instead of being orthogonalized or replaced by the default, and no bone or caller is special-cased; a remembered basis is the one the same values gave, so the result is the same number for number.

## @evidence contracts/development/implementation.md#efficient-algorithms

An exact immutable output of this producer costs one weak membership lookup. Other remembered records cost eleven scalar comparisons; new or edited ones validate three axes and normalize them, then register the produced immutable result. Prepared FK and inverse metadata use genuine outputs without probing arbitrary caller records; runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The admitted basis of a raw record is remembered with its actual scalars, since poses and limb fits reuse axes. Private weak membership identifies only this producer's successfully frozen own-data outputs, so normalization itself and inverse handedness metadata can reuse them without re-reading immutable values. Arbitrary copies, proxies and caller-created frozen bases keep their existing live comparisons and admission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One remembered basis per axes record remains in a weak map; one weak membership entry per produced immutable basis adds no strong lifetime. Both release with their owning records, and no skeleton, pose, angle or quaternion result population is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States the accepted basis, the thrown message shape with an example, that the result is frozen and may be shared, and when a remembered basis is reused.
