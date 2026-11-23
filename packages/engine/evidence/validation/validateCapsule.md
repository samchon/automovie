# src/validation/validateCapsule.ts#validateCapsule

## @evidence contracts/development/implementation.md#principled-implementation

Require distinct skeleton endpoints that are declared and FK-reachable, plus finite positive radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One canonical interface capsule serves collision, self-intersection and ground-contact gates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failure appends errors and returns false, so an unusable endpoint is not replaced by a guessed pose.

## @evidence contracts/development/common.md#meaningful-documentation

Radius uses model units, endpoint membership/reachability and boolean usability are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two set lookups and fixed scalar comparisons cost expected constant work plus text.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Sampling validators reuse precomputed skeleton/reachable sets across their capsules.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inputs and sets are borrowed; the caller owns diagnostics and the helper retains no resolved body or handle.
