# src/perform/HumanObject.ts#HumanObject.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A heading is a rotation about the world's up by that angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch on which form was given.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A frame given as one is returned as its position and rotation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/perform/HumanObject.ts#HumanObject.prop

## @evidence contracts/development/common.md#meaningful-documentation

States what the prop offers the actions and how a contact becomes a target.

## @evidence contracts/development/implementation.md#principled-implementation

A contact frame's translation is its point and its rotated `+Y` its outward normal, the affordance record's own convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the affordances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The colliders are the object's own when it gives them, and absent otherwise.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An exact native model and callback pair can pass its existing stationary domains to the prop reader without invoking either callback.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prop owns its affordances, colliders and any issued carrier domain metadata for its lifetime.

# src/perform/HumanObject.ts#HumanObject.cord

## @evidence contracts/development/common.md#meaningful-documentation

Documents the model and line identity and how to supply the result.

## @evidence contracts/development/implementation.md#principled-implementation

HumanObjectCord discretizes the existing model line in world metres and binds both endpoints to the owning prop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This is the object authoring entry. The cord's domain construction belongs to HumanObjectCord.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The author supplies no second endpoint declaration. The cord constructor refuses invalid span and domain inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

One call to the linear cord discretization and domain validator.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the provider's public span reader and the existing soft solver settings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a soft prop and its finite domain. Film-state ownership stays with the performance.

# src/perform/HumanObject.ts#HumanObject.seat

## @evidence contracts/development/common.md#meaningful-documentation

States what is read of the seat and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A seat contact's frame sits on the front edge with `+Z` toward the sitter's front and `+Y` up, so the placed frame's origin is the seat's place and its turned `+Z` the heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the seat, place its frame, read the heading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing or ambiguous seat is refused, never guessed.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
