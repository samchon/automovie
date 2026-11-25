# src/geometry/construction/AutoMovieSolidZip.ts#AutoMovieSolidZip.band

## @evidence contracts/development/implementation.md#principled-implementation

After orienting both sequences, advances one of two boundary indices per triangle using the smaller candidate parameter-gap criterion, producing a combinatorial strip between compatible cycles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One linear two-index walk owns triangle connectivity; the mesh caller owns geometric correspondence and outward orientation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not inspect world distances, test intersections/degeneracy or prove optimal triangulation; valid aligned disjoint sequences and matching array lengths are caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

Gives minimum boundary size, index-only output and the caller's orientation/geometric responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N+M) orientation/traversal and exactly N+M triangle triples for valid N/M boundaries, with O(N+M) reordered scratch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses already supplied cyclic parameters and vertex indices instead of recomputing arclength or evaluating geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Reordered arrays are call-local; only the fresh triangle-index triples escape, retaining no input arrays or world geometry.

# src/geometry/construction/AutoMovieSolidZip.ts#AutoMovieSolidZip.increasing

## @evidence contracts/development/implementation.md#principled-implementation

Infers turn from summed wrapped increments, chooses the least reduced start and unwraps successive parameters in that traversal order; valid one-turn correspondence is assumed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A reversal/start index table drives one copying pass without sorting vertex geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not validate length agreement, nonzero winding, duplicate parameters or finite input; zero accumulated turn uses the existing forward tie and positive remainders can be zero.

## @evidence contracts/development/common.md#meaningful-documentation

States orientation/start normalization, one-turn intent and returned-copy ownership rather than an independent admission guarantee.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three linear passes and O(N) order/output storage avoid a comparison sort.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same order table is used for both vertex and parameter copying, preserving their pairing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new vertex/angle arrays and releases its local order table; the supplied sequence is not mutated or retained.
