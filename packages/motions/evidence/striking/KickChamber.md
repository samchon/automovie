# src/striking/KickChamber.ts#KickChamber.IKey

## @evidence contracts/development/common.md#meaningful-documentation

Defines world-metre points and world foot rotation read after the knee fold.

## @evidence contracts/development/design.md#principled-representation

The two actual FK positions and orientation are the exact fields the kick's chamber interpolation consumes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three required outputs describe the chamber key without retaining a full pose or bone map.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses canonical vectors/quaternion and represents no success flag, fitted target or relaxed contact bound.

# src/striking/KickChamber.ts#KickChamber.fold

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fitted contact input, side, replacement knee flexion in degrees and actual world-frame outputs.

## @evidence contracts/development/implementation.md#principled-implementation

Replaces only the named lower-leg flexion in the original joint order, preserving the contact's already-fitted hip and other joint values, then reads actual knee/foot FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One unchanged ordered joint map and one canonical FK call yield the three chamber outputs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every authored joint still reaches FK admission; no fit, joint value, authored limit or chamber angle is omitted or approximated.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original J-joint map/admission remains; final FK computes only the requested knee/foot ancestry and two output records instead of the complete rig. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing fitted contact and FK owner; fixed requested-name metadata is shared by side, with no pose or time result reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each temporary pose/map ends on return or throw; only actual endpoint vectors and foot rotation escape, while two constant requested-name sets live with the module.
