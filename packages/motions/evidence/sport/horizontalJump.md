# src/sport/horizontalJump.ts#horizontalJump.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The landing place is the heel mark at the distance along the runway plus the body's heel-to-ankle offset; the apex and the needed speed are the equal-height projectile's at `ANGLE`; the jump plans the rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The run-up, the board and the foul, the landing place, the speed bound, then the jump.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foul or an unreachable distance is refused with its measure, never moved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two affordance reads and one jump plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the jump law whole, and the run-up reader every field event shares.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan is the jump's and retains what it retains.
