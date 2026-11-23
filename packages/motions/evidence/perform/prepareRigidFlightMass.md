# src/perform/prepareRigidFlightMass.ts#prepareRigidFlightMass

## @evidence contracts/development/common.md#meaningful-documentation

The reference uses root-frame solved bones in metres. Each returned mass segment uses the carrying bone's local frame; matches tests actual clinical coordinates that determine the intervening fixed frames.

## @evidence contracts/development/implementation.md#principled-implementation

The parallel-axis tensor of a rigid subtree and its mass-weighted centre transform with the carrying frame. Its linear and angular momentum include the translated and rotating mass of every descendant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Walk mass ancestors once, group local moments with the engine's physical mass owner, and retain the reference clinical slots needed to check later observations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Masses, attachment transforms and principal moments originate in this body's model and actual FK. A varying local transform, missing carrier or unusable composite precludes the reduced path.

## @evidence contracts/development/implementation.md#efficient-algorithms

One preparation visits each mass and its ancestors. Later geometry and inertia see one part per moving group, with a linear pass over public clinical slots to admit the group.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses combinePhysicalMassProperties for each genuine composite and keeps a singleton on its own carrying bone unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The flight owns only its copied local reference slots and numerical mass model. The reference frames, grouping lists and parent map are released after construction.
