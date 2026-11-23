# src/geometry/construction/AutoMovieViewParameter.ts#AutoMovieViewParameter.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Finite roots and a finite positive angle span define the monotone source domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns a copied record, undefined identity map, or named failure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses invalid endpoints without sorting or widening a domain.

## @evidence contracts/development/common.md#meaningful-documentation

States units and all return states.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant checks and a fixed-size copy.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One pure admission has no reusable effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns a copied record; no input is retained.

# src/geometry/construction/AutoMovieViewParameter.ts#AutoMovieViewParameter.at

## @evidence contracts/development/implementation.md#principled-implementation

Uses signed square root or the equivalent angle root/asin expression from the nearer endpoint to avoid cancellation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map serves all scalar meanings, with omission as identity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Clamps only a floating-point excess within the shared construction tolerance onto the endpoint; a larger excess is still refused, and no scalar value is altered.

## @evidence contracts/development/common.md#meaningful-documentation

States admitted-domain and invalid-query behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work with at most one root and asin.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure scalar mapping schedules no work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/construction/AutoMovieViewParameter.ts#AutoMovieViewParameter.station

## @evidence contracts/development/implementation.md#principled-implementation

Uses the square-root inverse and angle half-sine identity, from the nearer endpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One inverse serves all critical-station observations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Assumes the admitted parameter span and invents no closure.

## @evidence contracts/development/common.md#meaningful-documentation

States the in-span premise and millimetre result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and at most one sine.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One pure scalar inverse schedules no work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/construction/AutoMovieViewParameter.ts#AutoMovieViewParameter.jet

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates signed root and two-end angle analytically; zero endpoint distance has no finite change-of-parameter jet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pair feeds the scalar source chain rule, with null singularity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses no finite difference and leaves overflowing arithmetic observable to the caller.

## @evidence contracts/development/common.md#meaningful-documentation

States derivative order, singular absence and admitted-domain premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic per requested jet.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure derivatives coordinate no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns at most a two-number pair and retains nothing.

# src/geometry/construction/AutoMovieViewParameter.ts#AutoMovieViewParameter.inverseJet

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates s=pole+sign*q^2 or s=bottom+span*sin(q/2)^2; the angle first derivative uses separate square roots to avoid overflowing a*b.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One inverse jet serves analytic frame and coefficient chain rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid domains and nonfinite results return null; a zero first inverse derivative at a pole does not imply a finite forward station derivative.

## @evidence contracts/development/common.md#meaningful-documentation

Parameter endpoints are kernel mm; results are ds/dq and d2s/dq2, independently of scalar values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant checks and at most two roots use fixed storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure coordinate arithmetic schedules no work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh pair or null and retains nothing.

# src/geometry/construction/AutoMovieViewParameter.ts#AutoMovieViewParameter.transferJet

## @evidence contracts/development/implementation.md#principled-implementation

Uses analytic shared-pole root/angle compositions and their finite endpoint limits; other regular compositions use the two-order chain rule with the inverse jet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One coordinate-transfer owner keeps scalar and frame derivative conversions on the same maps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular source in a regular target or an unrepresentable result returns null. No Infinity-times-zero cancellation, derivative clamp or finite difference assigns a pole jet.

## @evidence contracts/development/common.md#meaningful-documentation

Returns dqSource/dqTarget and its second derivative; identical maps return identity, and distinct singular endpoints require the same station and inward side.

## @evidence contracts/development/implementation.md#efficient-algorithms

Bounded scalar cases take constant work and fixed result storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure source-coordinate arithmetic retains no preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns only a pair or null and keeps neither parameter record.
