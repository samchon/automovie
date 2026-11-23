# src/math/seededValue.ts#seededValue

## @evidence contracts/development/implementation.md#principled-implementation

Ordered seed parts enter mixSeed and an unsigned 32-bit avalanche; dividing the final word by two to the power 32 guarantees a deterministic half-open unit sample.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar generator serves effects, combat and formation decisions, with domain constants supplied by consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fixed constants define the generator for every input, without fixture outputs, operating-system entropy or a mutable global random stream.

## @evidence contracts/development/common.md#meaningful-documentation

States ordered parts, half-open output, deterministic behavior and the caller's independent-domain separation duty.

## @evidence contracts/development/implementation.md#efficient-algorithms

K seed parts require K constant-time folds and one final avalanche, using constant scalar state beyond the argument array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Parts update one rolling word in order; each call restarts from the same initial word rather than sharing stream history.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The argument array and scalar words live only for the call; no seed identities, generator instance or entropy handle remain.
