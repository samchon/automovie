# src/handling/manipulateFingering.ts#manipulateFingering

## @evidence contracts/development/common.md#meaningful-documentation

States the choice, its cost and the frame premise.

## @evidence contracts/development/implementation.md#principled-implementation

An exact Viterbi path (dynamic programming over a chain of five-state stages) minimizing summed wrist travel, Handrix's stated outcome of keeping the wrist still (ElKoura and Singh 2003).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forward pass and one back-trace per hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cost is a measured distance, with no weight; a contact that names its digit is kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fully authored fingering has one path and returns its digits directly; a single free contact keeps the original first-digit tie. Other sequences retain linear contacts times five squared Viterbi work, with each wrist placed once per stage and fixed digit geometry prepared once per hand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adjacent Viterbi stages retain their digit placements for every edge that reads the same contact, digit, hand and fixed rotation; the previous stage is released when the next replaces it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array and retains nothing.
