# src/rom/clampJointRomValues.ts#clampJointRomValues

## @evidence contracts/development/implementation.md#principled-implementation

Per-axis interval projection, the swing cone's blend toward the box point nearest neutral, and the swing-twist range's own projection read back on the joint's basis, as `clampJointRom` states them; each expression is the record form's, on the same operands, so the record is the same.

## @evidence contracts/development/implementation.md#clear-and-simple-structure `clampJointRom` reads a record's four fields and calls this; the arithmetic has one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite angles reset to neutral before the box; the edge tolerance `EDGE` only absorbs read-back rounding; unrestricted multi-turn overrides remain outside the cone's bisection guarantee, as on the record form.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three clamps and at most forty fixed cone iterations, or one overshoot test and, outside the range, one projection and one decomposition; one result record and, for a gated joint, one sanitized record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the caller's constraint and prepared frame; nothing is kept.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh record; frame and box metadata stay with their weak owners.

## @evidence contracts/development/common.md#meaningful-documentation

States the projection, its inputs' units and null meaning, and the fresh result.
