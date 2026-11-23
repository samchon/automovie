# src/actions/walkSupportHeight.ts#walkSupportHeight

## @evidence contracts/development/common.md#meaningful-documentation

The contact heights and landing-leg residuals are in world metres on the original plan clock.

## @evidence contracts/development/implementation.md#principled-implementation

Join the two feasible contact heights with zero terminal slope. The lifted leg contributes its segmental first moment times its lift to the measured adult centre-of-mass excursion. Fade the whole correction at takeoff and rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bracket a requested second between successive contacts, resolve only its two boundary heights and apply the phase envelope.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Bounds the original planned root without changing a foot, support interval or entry/arrival.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorts contact starts once. Binary search is logarithmic per query and each contact's static geometry is evaluated once on demand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same grounded leg geometry, excursion and original time as the gait; later queries of a stride reuse only its two geometric limits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns contact times, one height per sampled boundary and one residual per requested landing, independent of displayed frame count.
