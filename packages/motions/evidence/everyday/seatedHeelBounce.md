# src/everyday/seatedHeelBounce.ts#seatedHeelBounce.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the time base, input and admission.

## @evidence contracts/development/implementation.md#principled-implementation

Holds the ball at the entry socket, rotates the airborne heel about it, fits the ankle and checks achieved rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admits timing and supports, defines a single rocker curve and reads it at the periodic clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses an unsupported seated base or a failed joint fit instead of clamping the motion.

## @evidence contracts/development/implementation.md#efficient-algorithms

The joint range bounds admission before two fitted rocker witnesses. Playback takes constant work per posture, independent of the beat count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses shared foot geometry, range lookup, posture fitting, minimum jerk and support carry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the current plan's entry and curves.
