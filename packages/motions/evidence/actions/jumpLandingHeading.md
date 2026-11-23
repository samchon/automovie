# src/actions/jumpLandingHeading.ts#jumpLandingHeading

## @evidence contracts/development/common.md#meaningful-documentation

States the axes, units, admitted supports and unsupported recovery case.

## @evidence contracts/development/implementation.md#principled-implementation

The feet-first endpoint requires the somersault to restore +Y; only the signed twist remainder changes world yaw because both jump heading and twist act about +Y there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the terminal up axis and its support before planning any landing geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The signed winding remains in params for the airborne pass; the remainder sets only a rigid endpoint. Refuses unnamed raised supports and props whose turned footprint clearance has not been qualified.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed scalar arithmetic and comparisons.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The result is a pure function of the current authoring and travel heading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains no resources.
