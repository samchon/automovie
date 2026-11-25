# src/gym/createClimbingRope.ts#createClimbingRope

## @evidence contracts/development/implementation.md#principled-implementation

One rope rod from the anchor down its length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, one rod, one contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sway or stretch is modelled; the sizes are estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

One rod.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how it hangs and the contact.
