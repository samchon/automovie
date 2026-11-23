# src/gym/createSled.ts#createSled

## @evidence contracts/development/implementation.md#principled-implementation

A base box of one Rogue sled's length and width, and two pole rods from its back corners up to that sled's handle height, the drawn spacing apart; each handle is the pole's top, a hand's breadth below its end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the sled, draw the spacing, the base, the two poles with their handles, the deck.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The poles stand upright, not raked back; no plate horns or runners; the base's and the poles' thickness are named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the sled stands, which way it is pushed and its three contacts.
