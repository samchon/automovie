# src/perform/HumanPerformanceContactSpeed.ts#HumanPerformanceContactSpeed.weapon

## @evidence contracts/development/common.md#meaningful-documentation

States the reader, the window and the off-grid answer.

## @evidence contracts/development/implementation.md#principled-implementation

The largest end displacement between neighbouring grid seconds over their interval bounds the displacement between any two grid seconds by the triangle inequality, and every capsule point moves no farther than its ends do (each is a fixed affine mix of them).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The grid seconds from the first one asked are read once each, as far as an ask reaches, their neighbouring rates kept in order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every grid second of the window is read from the actual path; a second off the grid is given no bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

One read per grid second an ask reaches, once a search, which the caller shares with the scan's own reads at those seconds; the scan asks over windows doubling from one step, so the seconds read are at most twice those certified; each ask walks its window's steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grid seconds read are the scan's own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One number array over the steps read and the last axis read, released with the search.
