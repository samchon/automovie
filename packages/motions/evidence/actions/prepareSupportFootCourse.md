# src/actions/prepareSupportFootCourse.ts#prepareSupportFootCourse

## @evidence contracts/development/common.md#meaningful-documentation

States the course, frame, units, the bearing default and what is written.

## @evidence contracts/development/implementation.md#principled-implementation

Places the body's rigid foot by its real toe-joint offset at the linearly interpolated world point and fits the leg to it with the shared leg placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares the foot and leg geometry once; each call reads one point and writes one limb.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The held feet and hands keep the support law's fits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation; one leg placement per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The foot frame, rotation and leg placement are prepared once and shared by every call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The writer retains only its prepared geometry.
