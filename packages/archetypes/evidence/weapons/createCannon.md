# src/weapons/createCannon.ts#createCannon

## @evidence contracts/development/implementation.md#principled-implementation

Every size and weight is the manual's, built by `buildFieldGun`; the dimensions are its single figures, so the gun is the one the manual describes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, build the gun, and weigh it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None here; the construction's shortcuts are `buildFieldGun`'s.

## @evidence contracts/development/implementation.md#efficient-algorithms

One builder pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the gun stands, each contact and articulation, what is provisional and why it carries no friction.
