# src/props/createPotteryWheel.ts#createPotteryWheel

## @evidence contracts/development/implementation.md#principled-implementation

A column stand the potter's legs straddle, a head on a crank, a lump and a wall on a slider; the wall's contacts ride the slider.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Record the size, lay the stand and head, the clay, then the articulations and contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The clay's flow is not modelled: the wall is a rigid ring raised whole. Every size is a named provisional estimate.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Four parts and four contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the head's articulation, the rise and why a contact on the round wall holds in the turning frame.
