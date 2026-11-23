# src/kinematics/readsSwingTwistFrame.ts#readsSwingTwistFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the equivalence the test establishes, its inputs and the exact agreement it checks.

## @evidence contracts/development/implementation.md#principled-implementation

Decomposition and composition are inverse readings on one basis and rest frame, so agreeing axes, rotation order, twist placement, signs and neutrals make the composed rotation the decomposed one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One normalization of the range's axes and three exact comparisons of vectors and of axis frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact equality only; any difference reads as not the same, so a caller keeps the composed reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work; a prepared range frame lends its admitted axes (`SwingTwistFramePreparation.normalized`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by `swingTwistExcludedSwivels` and the hinged fit's legality reading, so the condition is stated once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure test that retains nothing.
