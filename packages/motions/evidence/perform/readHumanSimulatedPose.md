# src/perform/readHumanSimulatedPose.ts#readHumanSimulatedPose

## @evidence contracts/development/common.md#meaningful-documentation

States which bones change, the composition inverted, the two joint kinds, the chart difference, the held fingers, the root case and what is not displayed.

## @evidence contracts/development/implementation.md#principled-implementation

Inverts the forward-kinematics composition bone by bone, parent first; three-axis joints by the codec ordinary display composes with, fewer-axis joints by the solver's own free coordinates and the profile's axis-to-clinical mapping. The solver's frames are world bone-origin frames (`bindPhysicalWorld` places each rigid body at its bone's origin).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk of the rig; conversions belong to the codec and the profile's axes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No range clamp: a value outside the clinical range shows as solved. An unowned bone keeps the kinematic record itself, so a window the solver never takes over is the kinematic pose bit for bit.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the rig's B bones with constant work each, plus one joint lookup per owned bone; an empty ownership returns at once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading; the caller owns any caching.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh pose that shares the kinematic pose's unchanged joint records; retains nothing.
