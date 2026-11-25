# src/exercise/stretchQuadriceps.ts#stretchQuadriceps

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, the order the two joints give in, the fallback and every input's unit.

## @evidence contracts/development/implementation.md#principled-implementation

The stretch is the knee's flexion with the hip extended; the hand must hold the ankle, so the fold is the least one the arm's length allows, read off the body's own segments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fold function and two scans, the knee before the hip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both ends are the range table's limits, never stated angles, and an unreachable ankle is returned at the deepest fold instead of beyond a range.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains at most one trial per degree of the two ranges; each candidate ankle is evaluated once and the fixed hanging-thigh turn is shared by the knee scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the unchanged zero-extension thigh vector and arm reach are shared; each candidate still reads its exact flexion/extension, nested segment addition and original reach comparison.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
