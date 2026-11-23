# src/worldRamp.ts#worldRamp

## @evidence contracts/development/implementation.md#principled-implementation

The normalized perpendicular gives footprint half-width, while projection onto the centerline gives plane slopes and origin height; direct squared length must be finite and positive, retaining tiny/huge-coordinate precision limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The constructor stores the existing plane height rule, which shared surfaceHeightAt evaluates without retaining a second ramp callback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Blank id, nonpositive/nonfinite width, nonfinite base/rise and unusable squared axis throw; finite accepted fields do not universally prevent collapsed corners or overflow in derived plane coefficients.

## @evidence contracts/development/common.md#meaningful-documentation

Documents world XZ endpoints and metre width/base/rise, rectangular footprint order, extrapolated plane semantics and remaining representability premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar arithmetic and four fresh footprint points take constant time/space plus id validation; no lattice or mesh is generated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One centerline length supplies both width offset and plane coefficients; no cheap coefficient cache is retained across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh footprint/rule records, while input endpoints and any host resources are not retained; current helper callers are tests.
