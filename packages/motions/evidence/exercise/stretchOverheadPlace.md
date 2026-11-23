# src/exercise/stretchOverheadPlace.ts#stretchOverheadPlace

## @evidence contracts/development/common.md#meaningful-documentation

Describes the overhead places, the actual moving chest and the admitted entry premise.

## @evidence contracts/development/implementation.md#principled-implementation

Express the two source points in the standing chest frame and carry both by its current rigid transform. Their world difference is the palm's facing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Construct one source transform per admitted stretch, then select the per-side source landmarks and current reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the stretch's guarded entry admits fixed coordinates. Every evaluated chest retains its actual pose and exact FK.

## @evidence contracts/development/implementation.md#efficient-algorithms

One source chest transform per admitted plan and one current transform per arm observation. Each observation carries two points instead of solving the same current and source frames for each point separately.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both arm places share the fixed entry frame. Current data and its synchronous FK loan are used only on their actual posture, including along the continuation course.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The place readers own one entry frame and two source points per arm for the action lifetime. Current transforms and FK loans end with each evaluation.
