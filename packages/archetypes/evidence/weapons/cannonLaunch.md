# src/weapons/cannonLaunch.ts#cannonLaunch

## @evidence contracts/development/common.md#meaningful-documentation

States what is launched, from where and when it is refused.

## @evidence contracts/development/implementation.md#principled-implementation

The muzzle socket's +Y is the bore direction at every elevation because it rides the tube. Speed is the recorded muzzle velocity and calibre the separately recorded shot diameter; positive windage is checked when the bore is declared.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Refuse, articulate, read the frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown velocity or shot diameter is refused, without a speed default or treating a bore as a shot. Finite positive data and clearance inside a declared bore are admitted. The launch owns its mutable origin rather than exposing the model's contact vector.

## @evidence contracts/development/implementation.md#efficient-algorithms

One articulation at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one gun.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
