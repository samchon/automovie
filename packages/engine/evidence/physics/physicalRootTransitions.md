# src/physics/physicalRootTransitions.ts#physicalRootTransitions

## @evidence contracts/development/common.md#meaningful-documentation

States the bounds, released contacts and stance a root task carries, and when each is present.

## @evidence contracts/development/implementation.md#principled-implementation

The bounds are `physicalRootBounds`' on the limbs' carriers; the lifted limbs' carriers are released to the contact passes so their swings move them off the floor; every stance limb's carriers are the task's stance, so their legs keep their posture rows (Herzog et al. 2016, Section 5.3).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One carrier lookup shared by the bounds, the released contacts and the stance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts; a limb whose carriers have no body is left out.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the limbs and their carriers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
