# src/motion/MotionTrajectoryInterval.ts#MotionTrajectoryInterval

## @evidence contracts/development/common.md#meaningful-documentation

States seconds, sorted numeric inputs, clamped left time, held right/NaN behavior, interval share and internal borrowing.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the dense reader's existing right-end comparison, left clamp, binary search and (time-start)/h arithmetic once for both state blocks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuse the immediately preceding raw requested time, otherwise hold the end or locate and divide.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Object.is keys preserve signed zero and NaN; no time grid, tolerance, approximate equality, interpolation or physical callback is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

A new interior time costs O(log A) search for A accepted steps and one division. Full and quaternion projections share that work; the second matching lookup costs O(1). One private location record is reused, so the projected path gains no per-query location allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both projections read the same immutable steps at the same raw time, so their interval and share are identical. Keys update only after the numeric read succeeds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Captures numeric steps, two endpoints and one previous time plus one private location record. Both callers destructure the borrowed location synchronously before any other locate query; no location escapes into playback results or callback inputs. It retains no RHS, history or vector interpolation, and public values retain their copying boundary.
