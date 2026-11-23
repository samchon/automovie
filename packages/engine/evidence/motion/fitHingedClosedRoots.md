# src/motion/fitHingedClosedRoots.ts#fitHingedClosedRoots

## @evidence contracts/development/implementation.md#principled-implementation

The roots are the closed form of `immobileAxisSwivels` on the same sampled rotation; the admission is `prepareJointRotationProjection`'s own (its clamp leaves a reading inside the box as it is and it admits a difference of at most 1e-9 degrees); the order is `hingedSwivelAhead`'s exact comparison, taken only where bounds decide it. An explicit end-joint chart returns null so the general solver uses its chart-aware roots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Stops, roots, one loop over the candidates, one certainty test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No candidate is assumed met: one outside the margin is measured exactly, and a choice the unmeasured errors could change is not made here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three sampled rotations a branch for at most two entries, then one reading and one decomposition a root; at most two branches of at most two roots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the branch stops and swivel poses to the prepared geometry, the sinusoid algebra to `swivelArcs`, the clinical zero to `swivelJointReadings.rig`, the reading to `decomposeJointRotationOnBasis` and the score to the caller.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing past the call.

## @evidence contracts/development/common.md#meaningful-documentation

States the closed roots, the admission that spares the measurement, the order's certainty condition and every case left to the general search.
