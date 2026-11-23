# src/exercise/groupDanceCircle.ts#groupDanceCircle.course

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the course and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Footprints on the circle at each station's angle; hand targets at the chord's midpoint on the shared clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Circle, refusal, keys, hands.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hands' point is the neighbours' shared one; nothing is fitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in beats; constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared foot reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The course retains its keys.
