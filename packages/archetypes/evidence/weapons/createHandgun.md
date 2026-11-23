# src/weapons/createHandgun.ts#createHandgun

## @evidence contracts/development/implementation.md#principled-implementation

Three boxes from the picked pistol's published outside sizes; the trigger face stands at the published reach from the backstrap and moves by the published travel; a loaded pistol adds the difference between the makers' loaded and unloaded masses. A revolver and a flintlock pistol are `HandgunActions`'s, their sight radius derived where no maker gives it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the model and the sights, draw the other dimensions, build the grip, the slide and the trigger, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The grip is upright, without its rake, and there is no trigger guard; neither changes where a hand or a finger goes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what is and is not modelled, how the pistol stands and what each contact is.
