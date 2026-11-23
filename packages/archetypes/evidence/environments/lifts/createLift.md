# src/environments/lifts/createLift.ts#createLift

## @evidence contracts/development/implementation.md#principled-implementation

Validates timeline order and door interlocks, then generates the stock rigid car, admits compatible named stops through the existing built environment, and lowers ordinary stage pieces and object-motion tracks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reusable definition closes over the immutable schedule. Placement owns geometry and the transfer query projects the already admitted open intervals into the existing motion grammar.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only full-open stationary windows allow a requested crossing. No inference of a missing stop, permissive fallback, artificial stretching or real elevator controller is involved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Timeline preparation is O(K) with O(K + F) input copying for K keys and F stops. Placement resolves F stops, runs the wall and building admission, and lowers tracks for participating animated nodes. Transfer visits only this stop's open windows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The immutable authored data and open intervals are reused for every occurrence and transfer. The seeded car and geometry are built once per placement because the occurrence namespace, seed and references define that placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A module retains only copied authored data and one bounded open-window index. A placement returns its own plain records and opens no resources.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the source coordinate convention, supported frames, prop anchors, timeline and failure boundaries.
