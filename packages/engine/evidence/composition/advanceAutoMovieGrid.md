# src/composition/advanceAutoMovieGrid.ts#advanceAutoMovieGrid

## @evidence contracts/development/common.md#meaningful-documentation

States the grid, the margin, the bound's premises (non-negative, nondecreasing, undefined onward), the strict certificate, the search and its result.

## @evidence contracts/development/implementation.md#principled-implementation

Conservative advancement: a value read with margin d that moves no more than the bound cannot violate while the bound stays below d. The bound is nondecreasing in the later index, so the certified instants form a prefix and an exponential search followed by bisection finds its end exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One gallop, one bisection, one admission of each bound read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance widens the certificate: an instant whose bound equals the margin is read, and an undefined bound certifies nothing past what was certified before it.

## @evidence contracts/development/implementation.md#efficient-algorithms

For a certified stretch of n instants, about 2 log2 n bound reads and no reading of the checked value.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure search over the caller's bound reader; its caller owns what the reader shares.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
