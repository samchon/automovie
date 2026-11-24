# src/validation/validateLookAt.ts#validateLookAt

## @evidence contracts/development/implementation.md#principled-implementation

Compares each declared range with the eye joint's own range of motion on the axis and sign `resolveLookAt` writes, so an admitted gaze at full weight never leaves the rig's range; a null axis is immobile, as `validateJointRom` reads it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One leaf owns gaze admission and reuses `getConstraint` and the collector range, so validateModel only calls it in its fixed order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reports every failing range rather than clamping it, and special-cases no rig; the per-eye direction map follows from the twist sign, not from a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

States what each variant needs, the sign of each direction per eye, the immobile and unconstrained cases, and the refusal of unknown types.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two linear bone lookups, then a constant number of comparisons.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure admission step that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the violations appended to the caller's collector.
