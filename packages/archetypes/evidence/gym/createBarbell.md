# src/gym/createBarbell.ts#createBarbell

## @evidence contracts/development/implementation.md#principled-implementation

The shaft between the collars, laid in pieces so each hand's place has its own, a sleeve each side out to the bar's length, and one disc stack per side whose thickness grows with the load; every length the rule fixes is the rule's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, lay the shaft, the sleeves and the discs, two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

One solid stack stands for a side's discs, its thickness an estimate per kilogram, and the mass is spread over the shapes by volume, so the loaded bar's inertia about its length is not a measured one; no knurling and no collars' clamps.

## @evidence contracts/development/implementation.md#efficient-algorithms

Seven rods, nine when loaded.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the bar lies, where its origin is and what that asks of a scene, and the two contacts.
