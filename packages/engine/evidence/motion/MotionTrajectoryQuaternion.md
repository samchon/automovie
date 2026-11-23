# src/motion/MotionTrajectoryQuaternion.ts#MotionTrajectoryQuaternion.fixed

## @evidence contracts/development/common.md#meaningful-documentation

Reads seconds, holds endpoints and lends the internally retained quaternion to the copying public owner.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original shortest endpoint rotation vector and cubic Hermite weights, with Jr^-1 of the endpoint body rate rather than a truncated differential; the start derivative is the start body rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Locate the interval, reuse its endpoint differential and evaluate the same body exponential.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No vector state is read and no interpolation grid or angular tolerance changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1) lookup and quaternion work, with one previous-time and one previous-interval record; no n-component vector interpolation is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full and quaternion-only playback share one exact-time numeric quaternion reader; an immutable interval shares its rotation vector and endpoint slope.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains numeric knot orientations/rates and fixed-size previous records only; public callers receive copies and no physical callback enters this scope.

# src/motion/MotionTrajectoryQuaternion.ts#MotionTrajectoryQuaternion.dense

## @evidence contracts/development/common.md#meaningful-documentation

Reads film seconds and preserves the dense reader's held-end and NaN branch behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same accepted interval, polynomial and exponential as the full state reader, including the optional paired quintic coefficient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the common numeric interval, hold the endpoint or evaluate its quaternion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No vector interpolation, physical reevaluation or alternative q curve is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log A) lookup for A accepted steps and constant quaternion work; one exact-time read is reused.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full and projected readers consume one quaternion owner and common numeric interval locator. A full read's identical search/share is reused rather than repeated for its quaternion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the numeric interval reader, endpoint q and one previous quaternion; its factory captures completed numeric steps only, never builder props, RHS or shape history.
