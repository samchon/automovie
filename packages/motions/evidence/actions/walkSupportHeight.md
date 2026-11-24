# src/actions/walkSupportHeight.ts#walkSupportHeight

## @evidence contracts/development/common.md#meaningful-documentation

The contact heights and landing-leg residuals are in world metres on the original plan clock.

## @evidence contracts/development/implementation.md#principled-implementation

Join the two feasible contact heights with zero terminal slope. The lifted leg contributes its segmental first moment times its lift to the measured adult centre-of-mass excursion. Fade the whole correction at takeoff and rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Settle every contact height and every footfall's residual once as the walk is planned; a requested second is bracketed between successive contacts, reads their two heights and applies the phase envelope.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Bounds the original planned root without changing a foot, support interval or entry/arrival.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorts contact starts once and settles one ground solve per contact and one claim per footfall at plan time. Binary search is logarithmic per query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same grounded leg geometry, excursion and original time as the gait; every query of a stride reads its two prepared limits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns contact times, one height per contact boundary and one residual per footfall, independent of displayed frame count.
